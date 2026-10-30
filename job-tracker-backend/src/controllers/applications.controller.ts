import type { Request, Response } from "express";
import { applications } from "../data/application.js";


const getApplications = (req: Request, res: Response) => {
  res.json(applications);
};

const getApplicationById = (req: Request, res: Response) => {
  const { id } = req.params;
  const application = applications.find(
    (application) => application.id === Number(id),
  );

  if (!application) {
    return res
      .status(404)
      .json({ status: "FAILED", message: `No application with the id ${id}` });
  }
  res.json(application);
};

const createApplication = (req: Request, res: Response) => {
  const { company, role, status } = req.body;
  if (!company || !role || !status) {
    return res.status(400).json({
      status: "FAILED",
      message: "Please provide the important details",
    });
  }
  const application = {
    id: applications.length + 1,
    company,
    role,
    status,
  };
  applications.push(application);
  res.status(201).json(application);
};

const updateApplication = (req: Request, res: Response) => {
  const { id } = req.params;
  const application = applications.find((app) => app.id === Number(id));
  if (!application) {
    return res.status(404).json({
      status: "FAILED",
      message: "Please provide the important details",
    });
  }
  const { company, role, status } = req.body;
  if (company) {
    application.company = company;
  }

  if (role) {
    application.role = role;
  }

  if (status) {
    application.status = status;
  }
  res.status(200).json({ status: "OK", data: application });
};

const deleteApplication = (req: Request, res: Response) => {
  const { id } = req.params;
  const applicationIndex = applications.findIndex(
    (application) => application.id === Number(id),
  );

  if (applicationIndex === -1) {
    return res
      .status(404)
      .json({ status: "FAILED", message: `No application with the id ${id}` });
  }

  applications.splice(applicationIndex, 1);

  res.status(200).json({
    status: "OK",
    message: "Application deleted successfully",
  });
};

export {
    getApplications,
    getApplicationById,
    createApplication,
    updateApplication,
    deleteApplication
}