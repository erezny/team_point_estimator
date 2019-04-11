`cargo run` to start the backend server on local port 8080 and the create react app server on 3000 or the lowest available port.

Use `ngrok http 3000` to proxy the frontend code server that people will browse to

Use `ngrok http 8080` to proxy the backend server that the API connects to

Modify src/api.js to use the hostname ngrok is using for port 8080
