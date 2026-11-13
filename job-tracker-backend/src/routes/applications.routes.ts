import express from "express";
import {
    getApplications,
    getApplicationById,
    createApplication,
    updateApplication,
    deleteApplication
}  from "../controllers/applications.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route('/').get(authenticateUser, getApplications).post(authenticateUser, createApplication)

router.route('/:id').get(authenticateUser, getApplicationById).patch(authenticateUser, updateApplication).delete(authenticateUser, deleteApplication)

export default router;