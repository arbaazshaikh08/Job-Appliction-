import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      requied: [true, "Companay name is require"],
    },
    position: {
      type: String,
      requied: [true, " job position is requred"],
      maxilength: 100,
    },
    status: {
      type: String,
      enum: ["pending", "reject", "interview"],
      default: "pending",
    },
    workType: {
      type: String,
      enum: ["full-time", "part-time", "internship", "contaract"],
      default: "full-time",
    },
    workLocation: {
      type: String,
      defult: "paris",
      requied: [true, "work location is required"],
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Job = mongoose.model("Job", jobSchema);
