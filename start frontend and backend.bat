start cmd /k "sbt server/run"
start cmd /k cd frontend ^& yarn dev
start chrome http://localhost:8080/