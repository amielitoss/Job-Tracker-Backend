import type { Request, Response } from "express";
import { applications } from "../data/application.js";
import { applicationStatuses, type ApplicationStatus, type ApplicationType} from "../types/application.types.js";

type CreateApplicationBody = Omit<ApplicationType, "id">;

const getApplications = (req: Request, res: Response) => {
  res.json(applications);
};

const isValidStatus = (status: ApplicationStatus) => {
 return applicationStatuses.includes(status)
};

const isEmptyText = (value: string) => {
  return !value.trim();
}

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

  const { company, role, status }: CreateApplicationBody = req.body;
  if (!company || !company.trim() || !role || !role.trim() || !status) {
    return res.status(400).json({
      status: "FAILED",
      message: "Please provide the important details",
    });
  }

  if(!isValidStatus(status)) {
    return res.status(400).json({
      status: "FAILED",
      message: "Status must be Applied, Interview, Offer, or Rejected",
    });
  }

  const ids = applications.map((application) => application.id);
  const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

  const application: ApplicationType = {
    id: nextId,
    company: company.trim(),
    role: role.trim(),
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
      message: `No application with the id ${id}`,
    });
  }
  const { company, role, status }: Partial<CreateApplicationBody> = req.body;
  if (company !== undefined) {
    if(isEmptyText(company)){
      return res.status(400).json({
      status: "FAILED",
      message: "Company cannot be empty",
      });
    }
    application.company = company.trim();
  }

  if (role !== undefined) {
    if(isEmptyText(role)){
      return res.status(400).json({
      status: "FAILED",
      message: "Role cannot be empty",
      });
    }
    application.role = role.trim();
  }

  if(status && !isValidStatus (status)){
      return res.status(400).json({
      status: "FAILED",
      message: "Status must be Applied, Interview, Offer, or Rejected",
    });
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