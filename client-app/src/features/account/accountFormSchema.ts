import * as yup from "yup";

export const loginFormSchema = yup.object({
  email: yup.string().required().email(),
  password: yup.string().required(),
});

//signup
export const signupFormSchema = yup.object({
  firstName: yup.string().required(),
  lastName: yup.string().required(),
  email: yup.string().required().email(),
  password: yup
    .string()
    .required()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: yup
    .string()
    .required()
    .oneOf([yup.ref("password"), ""], "Passwords must match"),
});

