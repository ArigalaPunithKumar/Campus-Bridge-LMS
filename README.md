# 🎓 Campus-Bridge-LMS

**A comprehensive, role-based Learning Management System (LMS) built with React, Node.js, Express, and MySQL. It centralizes academic management, online coding practice, AI-powered assistance, and administrative operations into a single platform.**

🔗 **Live Demo:** [https://student-management-system-zeta-lyart.vercel.app/auth](https://student-management-system-zeta-lyart.vercel.app/auth)
📂 **Source Code:** [https://github.com/ArigalaPunithKumar/Campus-Bridge-LMS](https://github.com/ArigalaPunithKumar/Campus-Bridge-LMS)

---

## 📖 About the Project

Campus-Bridge-LMS is a full-stack web application designed to streamline communication and academic workflows between **Students, Faculty, and Administrators** through secure role-based access control (RBAC). 

The platform offers a modern learning experience by combining traditional LMS features (like course management, assignment grading, and resource sharing) with advanced integrations like an embedded online code compiler, automated leave management, and AI-powered learning assistance.

Built using **React.js** for a dynamic frontend, **Node.js/Express.js** for robust backend REST APIs, and **MySQL** for relational data management, the system ensures a highly secure and scalable environment for modern educational institutions.

---

## ✨ Key Features

### 👨‍🎓 Student Dashboard
* **Personalized Hub:** Secure login with a dedicated dashboard to track academic progress.
* **Course Resources:** Access study materials, assignments, and integrated YouTube courses.
* **Online Coding Practice:** Write, compile, and execute code directly in the browser.
* **AI Assistance:** Get real-time answers and learning support from an integrated AI assistant.
* **Account Settings:** Manage profile details and update passwords securely.

### 👨‍🏫 Faculty Dashboard
* **Course Management:** Upload syllabus materials, PDFs, and multimedia resources.
* **Coding Challenges:** Create, assign, and grade coding problems with public/private test cases.
* **Student Monitoring:** Track student performance and manage daily attendance records.
* **Leave Management:** Apply for faculty leave and approve/deny student leave requests.

### 👨‍💼 Admin Dashboard
* **User Management:** Create, update, and manage all student and faculty accounts.
* **Platform Controls:** Toggle global platform settings and system maintenance switches.
* **System Broadcasts:** Send system-wide announcements and automated email notifications.
* **Security:** Secure admin password resets and encrypted credential management.

---

## 💻 Online Coding Platform

A major highlight of Campus-Bridge-LMS is its integrated coding environment. Students no longer need to install IDEs or local compilers to practice programming. 

* Write code in Java directly within the browser UI.
* Compile and execute programs against custom constraints and formats.
* Submit solutions to coding challenges assigned by faculty.
* Receive instant execution results, error logs, and test-case validations.

---

## 🛠 Tech Stack

**Frontend Architecture:**
* **React.js** & **React Router DOM** for client-side routing and UI components.
* **Framer Motion** for smooth page transitions and micro-animations.
* **Axios** for API communication.
* **Vanilla CSS** for flexible, custom styling.

**Backend Architecture:**
* **Node.js** & **Express.js** for the RESTful API server.
* **MySQL** for structured, relational database management.
* **JWT (JSON Web Tokens)** & **bcryptjs** for secure authentication and password hashing.
* **Multer** for handling multipart/form-data (PDFs, files, assignments).
* **Nodemailer** for automated email dispatching.

**AI & Third-Party Integrations:**
* **OpenRouter SDK / Hercai** for the intelligent learning assistant.

---

## ❓ Frequently Asked Questions (FAQ)

### What is Campus-Bridge-LMS?
Campus-Bridge-LMS is a full-stack Learning Management System that provides role-based access for Students, Faculty, and Administrators to manage academic activities, coding practice, and resources on a single platform.

### Who can use the platform?
The system supports three distinct user roles:
* **Students** – Learn, practice coding, access resources, and track progress.
* **Faculty** – Upload content, assign coding challenges, monitor students, and manage leave requests.
* **Administrators** – Manage users, toggle platform settings, and handle platform security.

### How is authentication secured?
The application uses **JWT (JSON Web Tokens)** for stateless authentication. All user passwords (including Admins) are securely hashed and salted using **bcryptjs** before being stored in the MySQL database.

### Does the platform support online coding?
Yes! Students can write, compile, execute, and submit code directly within the application through the integrated online compiler environment, making technical practice highly accessible.

### What AI capabilities are included?
The platform integrates the **OpenRouter SDK** and **Hercai** to provide intelligent learning assistance. Students can ask the AI questions related to their coursework or coding problems and receive interactive, real-time responses.

---

*⭐ If you found this project helpful or interesting, please consider starring the repository!*
