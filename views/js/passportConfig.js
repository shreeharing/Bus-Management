import { Strategy as LocalStrategy } from 'passport-local';
import { pool } from './dbconfig.js';
import bcrypt from 'bcrypt';

function initialize(passport) {
    const authenticateUser = async (email, password, done) => {
        try {
            const result = await pool.query(
                "SELECT * FROM dept WHERE email = $1",
                [email]
            );

            if (result.rows.length === 0) {
                return done(null, false, { message: 'Email not registered' });
            }

            const user = result.rows[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return done(null, false, { message: 'Incorrect password' });
            }

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    };

    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));

    passport.serializeUser((user, done) => {
        done(null, user.dept_id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const result = await pool.query("SELECT * FROM dept WHERE dept_id = $1", [id]);
            if (result.rows.length === 0) return done(null, false);
            return done(null, result.rows[0]);
        } catch (err) {
            return done(err);
        }
    });
}

export default initialize;
