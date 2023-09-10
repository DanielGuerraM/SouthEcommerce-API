import express from 'express';
import morgan from 'morgan';

import userRoutes from './routes/userAdmin/users.routes.js'
import roleRoutes from './routes/userAdmin/role.routes.js'
import permissionRoutes from './routes/userAdmin/permission.routes.js'
import brandRoutes from './routes/productAdmin/brand.routes.js'
import categoryRoutes from './routes/productAdmin/category.routes.js'

const port = process.env.PORT || '1234'
const app = express();

app.use(express.json());
app.use(morgan('dev'))

app.use('/api/useradmin', userRoutes);
app.use('/api/useradmin', roleRoutes);
app.use('/api/useradmin', permissionRoutes);
app.use('/api/productadmin', brandRoutes);
app.use('/api/productadmin', categoryRoutes);

app.listen(port, () => {
  console.log(`Server on port ${port}`);
})