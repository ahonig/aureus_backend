Back-end of Clinical Applied Bacterial Genomics Analysis System (CABGen)

## Description
CABGen is an open source whole genome and RNA analysis platform for bacterial pathogens that enables researchers and healthcare professionals to analyze genomic data. This repository contains the back-end of the application, which is responsible for handling requests, interacting with the MongoDB database, and providing services for the front-end.

## Characteristics
- Storage and management of genomic data in an unstructured MongoDB database.
- RESTful API built with Node.js and Express to access genomic data and perform analysis.
- Integration of AJAX calls for interaction with the front-end.

## Previous requirements
Make sure you have the following components installed on your system before running the application:
- Node.js: [Download and Install Node.js](https://nodejs.org/)
- MongoDB: [Download and Install MongoDB](https://www.mongodb.com/try/download/community)

## Setting
1. Clone this repository: `git clone https://github.com/ahonig/aureus_backend/
2. Go to the project directory: `cd CABGen-backend`
3. Install the dependencies: `npm install`
4. Configure the environment variables in a `.env` file (you can use the `.env.example` file as a guide).
5. Start the server: `npm start`

## Use
- Access the RESTful API from the front-end using AJAX calls to obtain genomic data and perform analysis.
- See the API documentation for detailed information on available routes.

## Contributions
We welcome contributions to CABGen! If you would like to contribute, please follow these steps:
1. Fork this repository.
2. Create a branch for your contribution: `git checkout -b feature/new-feature`.
3. Make your changes and commit: `git commit -m "New feature added"`.
4. Submit your changes: `git push origin feature/new-feature`.
5. Create a pull request on this repository.

## Contact
If you have questions or comments, please contact us at [email](felydure@gmail.com).

---
