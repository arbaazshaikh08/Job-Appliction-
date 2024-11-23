import { Router } from "express";
import {
  createjobs,
  deleteJob,
  getJobs,
  JobStats,
  updateJob,
} from "../controller/job.controller.js";
import { verifyJWT } from "../middleweres/auth.middlewere.js";

const router = Router();

router.route("/create-job").post(verifyJWT, createjobs);
router.route("/get-jobs").get(verifyJWT, getJobs);
router.route("/update-job/:jobId").post(updateJob);
router.route("/delete-job/:jobId").delete(deleteJob);
router.route("/job-stats").post(verifyJWT, JobStats);
router.route("/delete-job/:jobId").delete(deleteJob);

export default router;
