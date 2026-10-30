import express from "express";
import {
    getApplications,
    getApplicationById,
    createApplication,
    updateApplication,
    deleteApplication
}  from "../controllers/applications.controller.js"

const router = express.Router();

router.route('/').get(getApplications).post(createApplication)

router.route('/:id').get(getApplicationById).patch(updateApplication).delete(deleteApplication)

export default router;