import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const { Pool } = pkg;

const isProduction=process.env.NODE_ENV === "production";
const connectionString=`postgres://bus_database:password@localhost:5432/mainbase
`;

const pool=new Pool({
    connectionString : isProduction ? process.env.DATABASE_URL : connectionString
});

export{pool};