# Campus Bridge LMS

A full-stack Learning Management System that brings student learning, faculty management, coding practice, and administrative workflows into one platform.

## Overview

Campus Bridge LMS provides separate experiences for **Students, Faculty, and Administrators** through role-based access control. It combines academic resource management with an in-browser Java coding environment and AI-assisted learning support.

## Problem

Academic resources, coding practice, communication, attendance, and administrative workflows are often spread across different systems. Campus Bridge brings these workflows together in one application.

## Key Features

### Student
- Secure authentication and personalized dashboard
- Course materials, assignments, PDFs, and learning resources
- Online Java coding practice
- Coding challenge submissions and test-case results
- AI-assisted learning support
- Profile and account management
- Leave management

### Faculty
- Course and learning-resource management
- PDF and resource uploads
- Coding challenge creation
- Public/private test cases
- Submission review
- Attendance and leave management

### Administrator
- Student and faculty account management
- Platform settings
- System announcements
- Email notifications
- Administrative security and password management

## Online Coding Platform

Students can write Java programs in the browser, compile and execute them, test solutions against configured test cases, view execution results, and submit coding challenges.

## Architecture

```text
Student / Faculty / Admin
          |
          v
    React Frontend
          |
      REST APIs
          |
          v
 Node.js + Express
          |
          v
       MySQL
       /     \
Compiler API  AI Services
```

## Technology Stack

**Frontend:** React.js, React Router, Axios, Framer Motion, CSS

**Backend:** Node.js, Express.js, JWT, bcryptjs, Multer, Nodemailer

**Database:** MySQL

**Integrations:** Online compiler API, OpenRouter/AI services, email services

## My Contributions

- Developed frontend and backend application features.
- Implemented role-based workflows for students, faculty, and administrators.
- Built course-resource and coding-practice interfaces.
- Integrated authentication and protected application flows.
- Connected React interfaces with backend APIs and MySQL.
- Implemented file-upload workflows.
- Integrated AI-assisted learning functionality.
- Worked on the Java code execution and evaluation workflow.

## Running Locally

### Prerequisites
- Node.js 18+
- MySQL
- npm

### Clone
```bash
git clone https://github.com/ArigalaPunithKumar/Campus-Bridge-LMS.git
cd Campus-Bridge-LMS
```

### Backend
```bash
cd Campus-Bridge-Backend
npm install
npm run dev
```

Configure the required database credentials, JWT secret, and service/API settings in `.env`.

### Frontend
```bash
cd ../Campus-Bridge-Frontend
npm install
npm run dev
```

## Live Demo

[Open Campus Bridge LMS](https://student-management-system-zeta-lyart.vercel.app/auth)

## What This Project Demonstrates

- Full-stack application development
- React component and state management
- REST API integration
- Relational database usage
- Authentication and authorization
- File handling
- Third-party API integration
- Role-based application design
- Practical problem solving

## Future Improvements

- Automated testing and CI/CD
- More granular permissions
- Improved code-execution sandboxing
- Analytics and progress tracking
- Additional coding languages

## Author

**A Punith Kumar**  
B.Tech Computer Science and Engineering

[GitHub](https://github.com/ArigalaPunithKumar)
