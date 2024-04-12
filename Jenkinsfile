pipeline {
    agent any
    environment {
        dockerHub = credentials('creddit-dockerhub')
    }
    stages {
        stage('cp env file'){
            when {
                anyOf {
                    changeRequest target: 'main'
                    branch 'main'
                }
            }
            steps {
                sh 'cp /home/jenkins/.env .'
            }
        }

        stage('Build & test') {
            when {
                anyOf {
                    changeRequest target: 'main'
                    branch 'main'
                }
            }
            steps {
                 sh "docker build . -t ${env.dockerHub_USR}/creddit_backend"
            }
        }

        stage('push to registery') {
            when{
                branch 'main'
            }
            steps {
                sh "docker login -u ${env.dockerHub_USR} -p ${env.dockerHub_PSW}"
                sh "docker push ${env.dockerHub_USR}/creddit_backend"
            }
        }

        stage('rebuild docker compose'){
            when{
                branch 'main'
            }
            steps {
                sh "/home/jenkins/pull_image.sh ${env.dockerHub_USR}  ${env.dockerHub_PSW} backend"
            }
        }
    }
}
