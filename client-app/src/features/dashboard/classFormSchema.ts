import * as Yup from 'yup';

export const createClassSchema = Yup.object({
    name: Yup.string().required('Class name is required').min(3, 'Minimum 3 characters'),
    description: Yup.string().notRequired(),
});
