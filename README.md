Step 1: Log into ngrok and create two named subdomains
Step 2: Modify src/main.rs ngrok commands to use the ngrok subdomains that you created
Step 3: Modify client/src/api.js line 29 to use the ngrok subdomain you created
Step 4: `cargo run`, which will start webpack, start the api server, and start ngrok tunnels
