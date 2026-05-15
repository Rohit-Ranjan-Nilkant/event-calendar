// ─────────────────────────────────────────────────────────────────────────────
// Event Calendar — Jenkins CI/CD Pipeline
//
// Prerequisites (one-time server setup):
//   • Run deploy/setup-server.sh on the target Ubuntu server
//   • Jenkins user is in the docker group
//   • Nginx is configured from deploy/nginx.conf and is running
//   • The following Secret Text credentials exist in Jenkins:
//       EC_DB_PASSWORD    – PostgreSQL password
//       EC_SESSION_SECRET – JWT signing secret (min 32 chars)
//       EC_ANTHROPIC_KEY  – Anthropic API key (LLM crawling, Super Admin only)
//   • A Pipeline job is configured to use this Jenkinsfile from SCM
//
// Architecture:
//   frontend  (Next.js)  → :3000  proxied by Nginx from /
//   backend   (Express)  → :4000  proxied by Nginx from /api/ and /avatars/
//   postgres  (PG 16)    → internal only, not exposed to host
// ─────────────────────────────────────────────────────────────────────────────

pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '5'))
        disableConcurrentBuilds()
    }

    environment {
        APP_NAME     = 'event-calendar'
        BACKEND_NAME = 'event-calendar-backend'
        COMPOSE_FILE = 'docker-compose.yml'
    }

    stages {

        // ── 1. Source ─────────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    def shortSha = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    echo "Building commit: ${shortSha}"
                    currentBuild.description = "commit ${shortSha}"
                }
            }
        }

        // ── 2. Build both Docker images ───────────────────────────────────────
        stage('Build Docker Images') {
            parallel {
                stage('Build frontend') {
                    steps {
                        sh """
                            docker build \\
                                -t ${APP_NAME}:${BUILD_NUMBER} \\
                                -t ${APP_NAME}:latest \\
                                -f Dockerfile .
                        """
                    }
                }
                stage('Build backend') {
                    steps {
                        sh """
                            docker build \\
                                -t ${BACKEND_NAME}:${BUILD_NUMBER} \\
                                -t ${BACKEND_NAME}:latest \\
                                -f backend/Dockerfile ./backend
                        """
                    }
                }
            }
        }

        // ── 3. Deploy via Docker Compose ──────────────────────────────────────
        //   • docker compose up replaces individual containers in-place
        //   • The backend entrypoint runs `prisma migrate deploy` automatically
        //   • Named volumes preserve postgres data and uploaded files
        stage('Deploy') {
            steps {
                withCredentials([
                    string(credentialsId: 'EC_DB_PASSWORD',    variable: 'POSTGRES_PASSWORD'),
                    string(credentialsId: 'EC_SESSION_SECRET', variable: 'SESSION_SECRET'),
                    string(credentialsId: 'EC_ANTHROPIC_KEY',  variable: 'ANTHROPIC_API_KEY'),
                ]) {
                    sh '''
                        # Write an env file for Docker Compose (avoids shell quoting issues)
                        cat > /tmp/ec_deploy.env <<ENVEOF
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
SESSION_SECRET=${SESSION_SECRET}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
FRONTEND_URL=https://yourdomain.com
ENVEOF

                        # Pull the compose file from the workspace and deploy
                        docker compose \\
                            --env-file /tmp/ec_deploy.env \\
                            -f ${COMPOSE_FILE} \\
                            up -d --remove-orphans

                        rm -f /tmp/ec_deploy.env
                    '''
                }
            }
        }

        // ── 4. Health checks ──────────────────────────────────────────────────
        stage('Health Check') {
            parallel {
                stage('Backend health') {
                    steps {
                        sh '''
                            echo "Waiting for backend..."
                            for i in $(seq 1 20); do
                                STATUS=$(curl -s -o /dev/null -w "%{http_code}" \\
                                            --max-time 5 http://127.0.0.1:4000/health 2>/dev/null || echo "000")
                                if [ "$STATUS" = "200" ]; then
                                    echo "✓ Backend healthy — HTTP ${STATUS} on attempt ${i}/20"
                                    exit 0
                                fi
                                echo "  [${i}/20] HTTP ${STATUS} — retrying in 4s..."
                                sleep 4
                            done
                            echo "✗ Backend health check timed out."
                            docker compose logs backend --tail 80
                            exit 1
                        '''
                    }
                }
                stage('Frontend health') {
                    steps {
                        sh '''
                            echo "Waiting for frontend..."
                            for i in $(seq 1 20); do
                                STATUS=$(curl -s -o /dev/null -w "%{http_code}" \\
                                            --max-time 5 http://127.0.0.1:3000/ 2>/dev/null || echo "000")
                                if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ]; then
                                    echo "✓ Frontend healthy — HTTP ${STATUS} on attempt ${i}/20"
                                    exit 0
                                fi
                                echo "  [${i}/20] HTTP ${STATUS} — retrying in 4s..."
                                sleep 4
                            done
                            echo "✗ Frontend health check timed out."
                            docker compose logs frontend --tail 80
                            exit 1
                        '''
                    }
                }
            }
        }

        // ── 5. Cleanup ────────────────────────────────────────────────────────
        stage('Prune Old Images') {
            steps {
                sh '''
                    for IMG in ${APP_NAME} ${BACKEND_NAME}; do
                        docker images ${IMG} --format "{{.Tag}} {{.ID}}" \\
                            | grep -v "latest" \\
                            | sort -rn \\
                            | tail -n +4 \\
                            | awk '{print $2}' \\
                            | xargs -r docker rmi 2>/dev/null || true
                    done
                '''
            }
        }
    }

    post {
        success {
            echo "✓ Build #${BUILD_NUMBER} deployed successfully."
        }
        failure {
            sh '''
                echo "=== Backend logs ==="
                docker compose logs backend --tail 80 2>/dev/null || true
                echo "=== Frontend logs ==="
                docker compose logs frontend --tail 80 2>/dev/null || true
            '''
            echo "✗ Build #${BUILD_NUMBER} failed — see logs above."
        }
    }
}
