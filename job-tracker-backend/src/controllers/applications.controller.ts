import type { Request, Response } from "express";
import {
  applicationStatuses,
  type ApplicationStatus,
  type ApplicationType,
} from "../types/application.types.js";
import pool from "../config/db.js";

type CreateApplicationBody = Omit<ApplicationType, "id">;

const getApplications = async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM applications;");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "FAILED", message: "Unable to fetch applications" });
  }
};

const isValidStatus = (status: ApplicationStatus) => {
  return applicationStatuses.includes(status);
};

const isEmptyText = (value: string) => {
  return !value.trim();
};

const isValidUUID = (id: string) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const getApplicationById = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const { id } = req.params;

  try {
    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid application id",
      });
    }
    const result = await pool.query(
      "SELECT * FROM applications WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "FAILED",
        message: `No application with the id ${id}`,
      });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "FAILED", message: "Unable to fetch application" });
  }
};

const createApplication = async (req: Request, res: Response) => {
  const { company, role, status }: CreateApplicationBody = req.body;
  if (!company || !company.trim() || !role || !role.trim() || !status) {
    return res.status(400).json({
      status: "FAILED",
      message: "Please provide the important details",
    });
  }

  if (!isValidStatus(status)) {
    return res.status(400).json({
      status: "FAILED",
      message: "Status must be Applied, Interview, Offer, or Rejected",
    });
  }

  try {
    const result = await pool.query(
      "INSERT INTO applications (company, role, status) VALUES ($1, $2, $3) RETURNING *;",
      [company.trim(), role.trim(), status],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: "FAILED", message: "Unable to create application" });
  }
};

const updateApplication = async (req: Request<{id: string}>, res: Response) => {
  const { id } = req.params;
  const { company, role, status }: Partial<CreateApplicationBody> = req.body;

  if (!isValidUUID(id)) {
    return res.status(400).json({
      status: "FAILED",
      message: "Invalid application id",
    });
  }

  if (company !== undefined) {
    if (isEmptyText(company)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Company cannot be empty",
      });
    }
  }

  if (role !== undefined) {
    if (isEmptyText(role)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Role cannot be empty",
      });
    }
  }

  if (status && !isValidStatus(status)) {
    return res.status(400).json({
      status: "FAILED",
      message: "Status must be Applied, Interview, Offer, or Rejected",
    });
  }

  try {
    const result = await pool.query(
      "UPDATE applications SET company = COALESCE($1, company), role = COALESCE($2, role), status = COALESCE($3, status) WHERE id = $4 RETURNING *;",
      [
        company ? company.trim() : null,
        role ? role.trim() : null,
        status ?? null,
        id,
      ],
    );

    if(result.rows.length === 0) {
       return res.status(404).json({
      status: "FAILED",
      message: `No application with the id ${id}`,
    });
    }
    res.status(200).json(result.rows[0])
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "FAILED",
      message: "Unable to update application",
    })
  }
};

const deleteApplication = async (req: Request<{id: string}>, res: Response) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    return res.status(400).json({
      status: "FAILED",
      message: "Invalid application id",
    });
  }
  
  try { 
    const result = await pool.query("DELETE FROM applications WHERE id = $1 RETURNING *;", [id])

    if(result.rows.length === 0){
       return res.status(404).json({
      status: "FAILED",
      message: `No application with the id ${id}`,
    });
    }
    res.status(200).json(result.rows[0])
  } catch(error){
    console.error(error);
     res.status(500).json({
      status: "FAILED",
      message: "Unable to delete application",
    })

  }
};

export {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
};
