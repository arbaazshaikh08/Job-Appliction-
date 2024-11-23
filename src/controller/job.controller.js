import mongoose from "mongoose";
import { Job } from "../model/job.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponce.js";
import { asyncHandler } from "../utils/AsyncHandlar.js";
import moment from "moment";

// Create Job
const createjobs = asyncHandler(async (req, res) => {
  try {
    const { company, position, workLocation } = req.body;

    if (!company || !position || !workLocation) {
      new ApiError(404, "Please Provide All Fields");
    }
    if (!req.user) {
      throw new ApiError(401, "User not authenticated. Please log in.");
    }
    req.body.createdBy = req.user._id;

    const job = await Job.create({
      company,
      position,
      workLocation,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, job, "Job cretaed SuccessFully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

// Get Job
const getJobs = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 5, status, workType, search, sort } = req.query;

    const queryObject = {};
    if (status && status !== "all") {
      queryObject.status = status;
    }
    if (workType && workType !== "all") {
      queryObject.workType = workType;
    }
    if (search) {
      queryObject.position = { $regax: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    let queryResult = Job.find(queryObject).skip(skip).limit(limit);

    //sorting logic
    if (sort === "latest") {
      queryResult = queryResult.sort("-createdAt");
    }
    if (sort === "oldest") {
      queryResult = queryResult.sort("createdAt");
    }
    if (sort === "a-z") {
      queryResult = queryResult.sort("position");
    }
    if (sort === "z-a") {
      queryResult = queryResult.sort("-position");
    }

    const totaljobs = await Job.countDocuments(queryObject);
    const numOfPage = Math.ceil(totaljobs / limit);

    // Get jobs based on query and pagination
    const jobs = await queryResult;

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { totaljobs, jobs, numOfPage },
          "Jobs fetched successfully"
        )
      );
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

// Update Jobs
const updateJob = asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;

    const { company, position, workLocation } = req.body;

    if (
      ![company, position, workLocation].some((field) => field?.trim() !== "")
    ) {
      throw new ApiError(400, "Please provide at least one field to update");
    }

    const job = await Job.findByIdAndUpdate(
      jobId,
      {
        $set: {
          company,
          position,
          workLocation,
        },
      },
      { new: true }
    );

    if (!job) {
      throw new ApiError(404, "Job not found.");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, job, "Job updated successfully"));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

// Delete Job
const deleteJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await Job.findByIdAndDelete(jobId);

    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Job deleted successfully", { job }));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

// Job Stats
const JobStats = asyncHandler(async (req, res) => {
  try {
    const stats = await Job.aggregate([
      // serch by user job
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const defaultStats = {
      pendding: stats.pendding || 0,
      reject: stats.reject || 0,
      interview: stats.interview || 0,
    };

    // Aggregate monthly job application stats
    let monthlyApplication = await Job.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    monthlyApplication = monthlyApplication
      .map((item) => {
        const {
          _id: { year, month },
          count,
        } = item;
        const date = moment()
          .month(month - 1)
          .year(year)
          .format("MMM Y");
        return { date, count };
      })
      .reverse(); // Reverse the order so the most recent month appears first

    return res.status(200).json(
      new ApiResponse(200, {
        totaljobs: stats.length,
        defaultStats,
        monthlyApplication,
      })
    );
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Something went wrong" });
  }
});

export { createjobs, getJobs, updateJob, deleteJob, JobStats };
