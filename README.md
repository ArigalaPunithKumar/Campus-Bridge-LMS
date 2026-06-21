Running the Frontend  
Open a new terminal and navigate to the frontend directory:  

Bash  
cd Campus-Bridge-Frontend  
Install the required dependencies:  

Bash  
npm install  
Start the React development server: 

Bash  
npm start  
The application should automatically open in your default browser at http://localhost:3000.  

Running the Backend  
Open a terminal and navigate to the backend directory:  

Bash  
cd Campus-Bridge-Backend  
Install the required dependencies:  

Bash  
npm install  
Set up your environment variables:  

Create a .env file in the root of the backend directory. 
 
Add necessary variables (e.g., Database URI, PORT, JWT secrets).  

Start the backend server:  

Bash  
npm start  
# or, for development mode:   
npm run dev  


Troubleshooting  
Browserslist Warning: If you see a warning about outdated browser data, run npx update-browserslist-db@latest inside the frontend directory.  

Missing Dependencies (ESLint): Ensure your React hooks (useEffect, etc.) have their required dependencies in the dependency arrays, or use // eslint-disable-next-line react-hooks/exhaustive-deps to bypass warnings safely.
"""  
