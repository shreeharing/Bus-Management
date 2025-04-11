import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import session from 'express-session';
import flash from 'express-flash';
import passport from 'passport';
import { pool } from './views/js/dbconfig.js';
import initializePassport from './views/js/passportConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
initializePassport(passport);

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

app.use(express.static(join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24
    }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return res.redirect('/adminDashboard');
    next();
}
function checkNotAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) return res.redirect('/login');
    next();
}

// Routes
app.get('/', async (req, res) => {
    try {
      const locationsQuery = await pool.query(`
        SELECT DISTINCT from_loc AS loc FROM route
        UNION
        SELECT DISTINCT to_loc AS loc FROM route
      `);
  
      const locations = locationsQuery.rows.map(row => row.loc);
      res.render('index', { locations });
    } catch (err) {
      console.error("Failed to load locations:", err);
      res.render('index', { locations: [] });
    }
  });
  

  

app.get('/about', (req, res) => res.render('about'));
app.get('/contact', (req, res) => res.render('contact'));
app.get('/login', checkAuthenticated, (req, res) => res.render('login'));
app.get('/register', checkAuthenticated, (req, res) => res.render('register'));
// Route to render search form with dropdowns
app.get('/search', async (req, res) => {
    try {
      const locResults = await pool.query(`
        SELECT DISTINCT from_loc AS location FROM route
        UNION
        SELECT DISTINCT to_loc FROM route
      `);
      const locations = locResults.rows.map(row => row.location || row.to_loc); // fix edge case
  
      res.render('search-buses', {
        locations,
        buses: [],
        from: '',
        to: '',
        selectedTime: ''
      });
    } catch (err) {
      console.error('Error loading search page:', err);
      res.status(500).send('Failed to load search page');
    }
  });
  
  
  
  // Route to handle the search form submission and show bus results
  app.post('/search', async (req, res) => {
    const { from, to, departure_time } = req.body;
  
    try {
      const locationQuery = await pool.query(`
        SELECT DISTINCT from_loc AS loc FROM route
        UNION
        SELECT DISTINCT to_loc AS loc FROM route
      `);
      const locations = locationQuery.rows.map(row => row.loc);
  
      let query = `
        SELECT
          b.bus_id,
          r.from_loc AS from_location,
          r.to_loc AS to_location,
          r.fare,
          r.estimated_duration,
          a.departure_time
        FROM assignroute a
        JOIN bus b ON a.bus_id = b.bus_id
        JOIN route r ON a.route_id = r.route_id
        WHERE r.from_loc = $1 AND r.to_loc = $2
      `;
  
      const values = [from, to];
  
      if (departure_time) {
        query += ` AND a.departure_time >= $3`;
        values.push(departure_time);
      }
  
      query += ` ORDER BY a.departure_time`;
  
      const results = await pool.query(query, values);
  
      res.render('search-buses', {
        buses: results.rows,
        from,
        to,
        locations,
        selectedTime: departure_time || ''
      });
    } catch (err) {
      console.error("Search error:", err);
      res.status(500).send("Server Error");
    }
  });
  
  

  app.get('/adminDashboard', checkNotAuthenticated, async (req, res) => {
    const dept_id = req.user.dept_id;
  
    try {
      const [dept, busCounts, empCounts, roleCounts] = await Promise.all([
        pool.query("SELECT * FROM dept WHERE dept_id = $1", [dept_id]),
        pool.query(`
          SELECT 
            COUNT(*) FILTER (WHERE status = true) AS active_buses,
            COUNT(*) FILTER (WHERE status = false) AS inactive_buses
          FROM bus
          WHERE dept_id = $1
        `, [dept_id]),
        pool.query(`
          SELECT 
            COUNT(*) FILTER (WHERE status = true) AS active_employees,
            COUNT(*) FILTER (WHERE status = false) AS inactive_employees
          FROM employee
          WHERE dept_id = $1
        `, [dept_id]),
        pool.query(`
          SELECT 
            job_title,
            COUNT(*) FILTER (WHERE status = true) AS active,
            COUNT(*) FILTER (WHERE status = false) AS inactive
          FROM employee
          WHERE dept_id = $1 AND job_title IN ('Driver', 'Conductor')
          GROUP BY job_title
        `, [dept_id])
      ]);
  
      const driverStats = roleCounts.rows.find(r => r.job_title === 'Driver') || { active: 0, inactive: 0 };
      const conductorStats = roleCounts.rows.find(r => r.job_title === 'Conductor') || { active: 0, inactive: 0 };
  
      res.render('adminDashboard', {
        user: dept.rows[0],
        busCounts: busCounts.rows[0],
        empCounts: empCounts.rows[0],
        driverStats,
        conductorStats,
        messages: req.flash()
      });
  
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      req.flash('error_msg', 'Failed to load dashboard.');
      res.redirect('/login');
    }
  });
    
app.post('/register', async (req, res) => {
    const { name, email, password1, password2 } = req.body;
    let errorsList = [];

    if (!name || !email || !password1 || !password2) {
        errorsList.push({ message: 'Please enter all the fields' });
    }
    if (password1.length < 6) {
        errorsList.push({ message: 'Password should consist of at least 6 characters' });
    }
    if (password1 !== password2) {
        errorsList.push({ message: 'Passwords do not match' });
    }

    if (errorsList.length > 0) return res.render('register', { errorsList });

    try {
        const userExists = await pool.query("SELECT * FROM dept WHERE email=$1", [email]);
        if (userExists.rows.length > 0) {
            errorsList.push({ message: 'Email already exists' });
            return res.render('register', { errorsList });
        }

        const hashedPassword = await bcrypt.hash(password1, 10);
        const newUser = await pool.query(
            "INSERT INTO dept(name, email, password) VALUES($1, $2, $3) RETURNING *",
            [name, email, hashedPassword]
        );

        req.session.tempDeptId = newUser.rows[0].dept_id;
        res.redirect('/manager-details');
    } catch (err) {
        console.error('Registration error:', err);
        res.render('register', { errorsList: [{ message: 'Something went wrong' }] });
    }
});

app.get('/manager-details', (req, res) => {
    if (!req.session.tempDeptId) return res.redirect('/register');
    res.render('managerDetails');
});

app.post('/manager-details', async (req, res, next) => {
    const { manager_name, dob, gender, salary, contact, address, hire_date, status } = req.body;
    const dept_id = req.session.tempDeptId;
    if (!dept_id) return res.redirect('/register');

    try {
        const result = await pool.query(
            `INSERT INTO employee 
             (name, dob, gender, salary, job_title, contact, address, hire_date, dept_id, status)
             VALUES ($1, $2, $3, $4, 'Manager', $5, $6, $7, $8, $9)
             RETURNING emp_id`,
            [manager_name, dob, gender, parseFloat(salary), contact, address, hire_date, dept_id, status === 'true']
        );

        const managerEmpId = result.rows[0].emp_id;

        await pool.query("UPDATE dept SET manager_name = $1, manager_id = $2 WHERE dept_id = $3",
            [manager_name, managerEmpId, dept_id]);

        const user = await pool.query("SELECT * FROM dept WHERE dept_id = $1", [dept_id]);
        req.login(user.rows[0], (err) => {
            if (err) return next(err);
            delete req.session.tempDeptId;
            return res.redirect('/adminDashboard');
        });
    } catch (err) {
        console.error('Error adding manager:', err);
        req.flash('error_msg', 'Failed to add manager. Please check inputs.');
        res.redirect('/manager-details');
    }
});

app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            req.flash('error_msg', info.message || 'Login failed');
            return res.redirect('/login');
        }
        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.redirect('/adminDashboard');
        });
    })(req, res, next);
});

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
      if (err) return next(err);
      req.flash('success_msg', 'You have logged out successfully.');
      req.session.destroy((err) => {
          if (err) return next(err);
          res.clearCookie('connect.sid');
          res.redirect('/');
      });
  });
});

app.get('/manage-buses', checkNotAuthenticated, async (req, res) => {
  const deptId = req.user.dept_id;
  const view = req.query.view || 'own'; // 'own' or 'all'
  const status = req.query.status || 'all'; // 'active', 'inactive', 'all'

  const viewAll = view === 'all';
  const statusFilter = status; // Pass as-is for EJS logic

  let query = "SELECT * FROM bus";
  let params = [];

  if (!viewAll) {
    query += " WHERE dept_id = $1";
    params.push(deptId);
    if (status === 'active' || status === 'inactive') {
      query += " AND status = $" + (params.length + 1);
      params.push(status === 'active');
    }
  } else if (status === 'active' || status === 'inactive') {
    query += " WHERE status = $1";
    params.push(status === 'active');
  }

  try {
    const buses = await pool.query(query, params);
    res.render('manageBuses', {
      buses: buses.rows,
      user: req.user,
      messages: req.flash(),
      viewAll,
      statusFilter
    });
  } catch (err) {
    console.error("Error loading buses:", err);
    res.render('manageBuses', {
      buses: [],
      user: req.user,
      messages: req.flash(),
      viewAll: false,
      statusFilter: 'all'
    });
  }
});

  app.post('/manage-buses', checkNotAuthenticated, async (req, res) => {
    const { capacity, status, serving_from } = req.body;
    const dept_id = req.user.dept_id;
  
    const messages = { success: [], error: [] };
  
    try {
      await pool.query(
        `INSERT INTO bus (capacity, status, serving_from, dept_id)
         VALUES ($1, $2, $3, $4)`,
        [capacity, status === 'true', serving_from, dept_id]
      );
  
      messages.success.push('Bus added successfully!');
      res.redirect('/manage-buses');
    } catch (err) {
      console.error('Error adding bus:', err);
      messages.error.push('Failed to add bus.');
      res.render('manageBuses', {
        buses: [],
        messages,
        user: req.user
      });
    }
  });
  

  app.post('/delete-bus/:id', checkNotAuthenticated, async (req, res) => {
    const busId = parseInt(req.params.id);
    const deptId = req.user.dept_id;
    const messages = { success: [], error: [] };
  
    try {
      const result = await pool.query("SELECT dept_id FROM bus WHERE bus_id = $1", [busId]);
  
      if (result.rows.length === 0) {
        messages.error.push("Bus not found.");
      } else if (result.rows[0].dept_id !== deptId) {
        messages.error.push("You are not authorized to delete this bus.");
      } else {
        await pool.query("DELETE FROM bus WHERE bus_id = $1", [busId]);
        messages.success.push("Bus deleted successfully!");
      }
  
      const buses = await pool.query("SELECT * FROM bus ORDER BY bus_id");
      res.render('manageBuses', {
        buses: buses.rows,
        user: req.user,
        messages
      });
  
    } catch (err) {
      console.error("Error deleting bus:", err);
      messages.error.push("Failed to delete bus.");
      const buses = await pool.query("SELECT * FROM bus ORDER BY bus_id");
      res.render('manageBuses', {
        buses: buses.rows,
        user: req.user,
        messages
      });
    }
  });
  

app.post('/edit-bus/:id', checkNotAuthenticated, async (req, res) => {
    const busId = parseInt(req.params.id);
    const { capacity, status, serving_from } = req.body;
    const deptId = req.user.dept_id;

    try {
        const result = await pool.query("SELECT dept_id FROM bus WHERE bus_id = $1", [busId]);

        if (result.rows.length === 0) {
            req.flash('error_msg', 'Bus not found.');
            return res.redirect('/manage-buses');
        }

        if (result.rows[0].dept_id !== deptId) {
            req.flash('error_msg', 'You are not authorized to edit this bus.');
            return res.redirect('/manage-buses');
        }

        await pool.query(
            "UPDATE bus SET capacity = $1, status = $2, serving_from = $3 WHERE bus_id = $4",
            [capacity, status === 'true', serving_from, busId]
        );

        req.flash('success_msg', 'Bus updated successfully!');
        res.redirect('/manage-buses');
    } catch (err) {
        console.error("Error updating bus:", err);
        req.flash('error_msg', 'Failed to update bus.');
        res.redirect('/manage-buses');
    }
});app.post('/delete-bus/:id', checkNotAuthenticated, async (req, res) => {
  const busId = parseInt(req.params.id);
  const deptId = req.user.dept_id;

  // 🧠 Preserve filters from query string
  const view = req.query.view || 'own';
  const status = req.query.status || 'all';
  const viewAll = view === 'all';
  const statusFilter = status;

  const messages = { success: [], error: [] };

  try {
    const result = await pool.query("SELECT dept_id FROM bus WHERE bus_id = $1", [busId]);

    if (result.rows.length === 0) {
      messages.error.push("Bus not found.");
    } else if (result.rows[0].dept_id !== deptId && !viewAll) {
      messages.error.push("You are not authorized to delete this bus.");
    } else {
      // Delete logic
      const assignment = await pool.query(
        `SELECT driver_id, conductor_id FROM assignroute WHERE bus_id = $1`,
        [busId]
      );

      if (assignment.rows.length > 0) {
        const { driver_id, conductor_id } = assignment.rows[0];
        await Promise.all([
          pool.query("UPDATE employee SET status = true WHERE emp_id = $1", [driver_id]),
          pool.query("UPDATE employee SET status = true WHERE emp_id = $1", [conductor_id])
        ]);
        await pool.query("DELETE FROM assignroute WHERE bus_id = $1", [busId]);
      }

      await pool.query("DELETE FROM bus WHERE bus_id = $1", [busId]);
      messages.success.push("Bus and related assignment deleted. Driver and Conductor reactivated.");
    }

    // 🔁 Re-run filtered query
    let query = "SELECT * FROM bus";
    const params = [];

    if (!viewAll) {
      query += " WHERE dept_id = $1";
      params.push(deptId);

      if (status === 'active' || status === 'inactive') {
        query += " AND status = $" + (params.length + 1);
        params.push(status === 'active');
      }
    } else if (status === 'active' || status === 'inactive') {
      query += " WHERE status = $1";
      params.push(status === 'active');
    }

    const buses = await pool.query(query, params);

    res.render('manageBuses', {
      buses: buses.rows,
      user: req.user,
      messages,
      viewAll,
      statusFilter
    });

  } catch (err) {
    console.error("Error deleting bus:", err);
    messages.error.push("Failed to delete bus.");
    res.render('manageBuses', {
      buses: [],
      user: req.user,
      messages,
      viewAll,
      statusFilter
    });
  }
});
app.get('/manage-employees', checkNotAuthenticated, async (req, res) => {
  const deptId = req.user.dept_id;
  const view = req.query.view || 'own'; // 'own' or 'all'
  const status = req.query.status || 'all'; // 'active', 'inactive', 'all'
  const role = req.query.role || 'all'; // 'Manager', 'Driver', 'Conductor', 'all'

  const viewAll = view === 'all';
  const statusFilter = status;
  const roleFilter = role;

  let query = "SELECT * FROM employee";
  const params = [];

  let conditions = [];

  if (!viewAll) {
    conditions.push(`dept_id = $${params.length + 1}`);
    params.push(deptId);
  }

  if (status !== 'all') {
    conditions.push(`status = $${params.length + 1}`);
    params.push(status === 'active');
  }

  if (role !== 'all') {
    conditions.push(`job_title = $${params.length + 1}`);
    params.push(role);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(' AND ');
  }

  try {
    const result = await pool.query(query, params);
    res.render('manageEmployees', {
      employees: result.rows,
      user: req.user,
      messages: req.flash(),
      viewAll,
      statusFilter,
      roleFilter
    });
  } catch (err) {
    console.error('Error fetching filtered employees:', err);
    res.render('manageEmployees', {
      employees: [],
      user: req.user,
      messages: { error: ['Failed to load employees.'] },
      viewAll,
      statusFilter,
      roleFilter
    });
  }
});


app.post('/manage-employees', checkNotAuthenticated, async (req, res) => {
  const { name, dob, gender, salary, job_title, contact, address, hire_date, status } = req.body;
  const dept_id = req.user.dept_id;
  const messages = { success: [], error: [] };

  try {
    await pool.query(
      `INSERT INTO employee 
       (name, dob, gender, salary, job_title, contact, address, hire_date, dept_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [name, dob, gender, salary, job_title, contact, address, hire_date, dept_id, status === 'true']
    );
    messages.success.push('Employee added successfully!');
  } catch (err) {
    console.error('Error adding employee:', err);
    messages.error.push('Failed to add employee.');
  }

  const result = await pool.query('SELECT * FROM employee');
  res.render('manageEmployees', {
    employees: result.rows,
    user: req.user,
    messages,
    viewAll: false,
    statusFilter: 'all',
    roleFilter: 'all'
  });
});
app.post('/edit-employee/:id', checkNotAuthenticated, async (req, res) => {
  const empId = parseInt(req.params.id);
  const deptId = req.user.dept_id;
  const messages = { success: [], error: [] };

  try {
    const emp = await pool.query("SELECT dept_id FROM employee WHERE emp_id = $1", [empId]);

    if (emp.rows.length === 0) {
      messages.error.push("Employee not found.");
    } else if (emp.rows[0].dept_id !== deptId) {
      messages.error.push("You are not authorized to edit this employee.");
    } else {
      const { name, dob, gender, salary, job_title, contact, address, hire_date, status } = req.body;
      await pool.query(
        `UPDATE employee SET name=$1, dob=$2, gender=$3, salary=$4, job_title=$5,
         contact=$6, address=$7, hire_date=$8, status=$9 WHERE emp_id=$10`,
        [name, dob, gender, salary, job_title, contact, address, hire_date, status === 'true', empId]
      );
      messages.success.push("Employee updated successfully.");
    }

    const allEmployees = await pool.query("SELECT * FROM employee");
    res.render("manageEmployees", {
      employees: allEmployees.rows,
      user: req.user,
      messages,
      viewAll: false,
      statusFilter: 'all',
      roleFilter: 'all'
    });

  } catch (err) {
    console.error("Error editing employee:", err);
    messages.error.push("Failed to edit employee.");
    const allEmployees = await pool.query("SELECT * FROM employee");
    res.render("manageEmployees", {
      employees: allEmployees.rows,
      user: req.user,
      messages,
      viewAll: false,
      statusFilter: 'all',
      roleFilter: 'all'
    });
  }
});
app.post('/delete-employee/:id', checkNotAuthenticated, async (req, res) => {
  const empId = parseInt(req.params.id);
  const deptId = req.user.dept_id;
  const messages = { success: [], error: [] };

  try {
    const emp = await pool.query('SELECT dept_id, job_title FROM employee WHERE emp_id = $1', [empId]);

    if (emp.rows.length === 0) {
      messages.error.push('Employee not found.');
    } else if (emp.rows[0].dept_id !== deptId) {
      messages.error.push("You are not authorized to delete this employee.");
    } else if (emp.rows[0].job_title === 'Manager') {
      messages.error.push("You cannot delete a Manager.");
    } else {
      const assignment = await pool.query(
        `SELECT assign_id, bus_id, driver_id, conductor_id
         FROM assignroute
         WHERE driver_id = $1 OR conductor_id = $1`,
        [empId]
      );

      if (assignment.rows.length > 0) {
        const { assign_id, bus_id, driver_id, conductor_id } = assignment.rows[0];

        if (driver_id !== empId) {
          await pool.query("UPDATE employee SET status = true WHERE emp_id = $1", [driver_id]);
        }
        if (conductor_id !== empId) {
          await pool.query("UPDATE employee SET status = true WHERE emp_id = $1", [conductor_id]);
        }

        await pool.query("UPDATE bus SET status = true WHERE bus_id = $1", [bus_id]);
        await pool.query("DELETE FROM assignroute WHERE assign_id = $1", [assign_id]);
      }

      await pool.query('DELETE FROM employee WHERE emp_id = $1', [empId]);
      messages.success.push('Employee deleted. Related assignment cleaned and others reactivated.');
    }

    const allEmployees = await pool.query('SELECT * FROM employee');
    res.render('manageEmployees', {
      employees: allEmployees.rows,
      user: req.user,
      messages,
      viewAll: false,
      statusFilter: 'all',
      roleFilter: 'all'
    });

  } catch (err) {
    console.error("Error deleting employee:", err);
    messages.error.push('Something went wrong while deleting.');
    const allEmployees = await pool.query('SELECT * FROM employee');
    res.render('manageEmployees', {
      employees: allEmployees.rows,
      user: req.user,
      messages,
      viewAll: false,
      statusFilter: 'all',
      roleFilter: 'all'
    });
  }
});

app.get('/routes', checkNotAuthenticated, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM route ORDER BY route_id');
        res.render('manageRoutes', {
            routes: result.rows,
            messages: req.flash()
        });
    } catch (err) {
        console.error('Error fetching routes:', err);
        req.flash('error_msg', 'Failed to load routes.');
        res.redirect('/adminDashboard');
    }
});

app.post('/routes', checkNotAuthenticated, async (req, res) => {
    const { from_loc, to_loc, distance, estimated_duration, fare } = req.body;

    try {
        await pool.query(
            `INSERT INTO route (from_loc, to_loc, distance, estimated_duration, fare)
             VALUES ($1, $2, $3, $4, $5)`,
            [from_loc, to_loc, distance, estimated_duration, fare]
        );
        req.flash('success_msg', 'Route added successfully!');
    } catch (err) {
        console.error('Error adding route:', err);
        req.flash('error_msg', 'Failed to add route.');
    }
    res.redirect('/routes');
});
app.get('/assign-routes', checkNotAuthenticated, async (req, res) => {
  const dept_id = req.user.dept_id;
  const view = req.query.view || 'own';
  const viewAll = view === 'all';

  try {
    const [buses, routes, drivers, conductors, assignments] = await Promise.all([
      pool.query("SELECT * FROM bus WHERE status = true AND dept_id = $1", [dept_id]),
      pool.query("SELECT * FROM route"),
      pool.query(`SELECT emp_id, name FROM employee WHERE dept_id = $1 AND job_title = 'Driver' AND status = true`, [dept_id]),
      pool.query(`SELECT emp_id, name FROM employee WHERE dept_id = $1 AND job_title = 'Conductor' AND status = true`, [dept_id]),
      pool.query(
        `
        SELECT 
          a.assign_id, 
          b.bus_id, 
          r.from_loc, 
          r.to_loc,
          d.name as driver_name, 
          c.name as conductor_name,
          a.departure_time
        FROM assignroute a
        JOIN bus b ON a.bus_id = b.bus_id
        JOIN employee d ON a.driver_id = d.emp_id
        JOIN employee c ON a.conductor_id = c.emp_id
        JOIN route r ON a.route_id = r.route_id
        WHERE ${viewAll ? '1=1' : 'a.manager_id = $1'}
        ORDER BY a.departure_time DESC
        `,
        viewAll ? [] : [req.user.manager_id]
      )
    ]);

    res.render('assignRoutes', {
      buses: buses.rows,
      routes: routes.rows,
      drivers: drivers.rows,
      conductors: conductors.rows,
      assignments: assignments.rows,
      messages: req.flash(),
      viewAll
    });

  } catch (err) {
    console.error('Error loading assign route page:', err);
    req.flash('error_msg', 'Failed to load assignment data.');
    res.redirect('/adminDashboard');
  }
});


app.post('/assign-routes', checkNotAuthenticated, async (req, res) => {
    const { bus_id, route_id, driver_id, conductor_id, departure_time } = req.body;
    const manager_id = req.user.manager_id;
  
    // Basic validation
    if (!bus_id || !route_id || !driver_id || !conductor_id || !departure_time) {
      req.flash('error_msg', 'All fields are required.');
      return res.redirect('/assign-routes');
    }
  
    // Check if date is in the future
    const selectedDate = new Date(departure_time);
    const now = new Date();
  
    if (selectedDate <= now) {
      req.flash('error_msg', 'Departure time must be in the future.');
      return res.redirect('/assign-routes');
    }
  
    try {
      // Insert into assignroute table
      await pool.query(
        `INSERT INTO assignroute (bus_id, conductor_id, driver_id, route_id, manager_id, departure_time)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [bus_id, conductor_id, driver_id, route_id, manager_id, departure_time]
      );
  
      // Mark bus and employees as inactive
      await Promise.all([
        pool.query("UPDATE employee SET status = false WHERE emp_id = $1", [driver_id]),
        pool.query("UPDATE employee SET status = false WHERE emp_id = $1", [conductor_id]),
        pool.query("UPDATE bus SET status = false WHERE bus_id = $1", [bus_id])
      ]);
  
      req.flash('success_msg', 'Route assigned successfully!');
      res.redirect('/assign-routes');
    } catch (err) {
      console.error('Error assigning route:', err);
      req.flash('error_msg', 'Failed to assign route.');
      res.redirect('/assign-routes');
    }
  });
  app.post('/release-assignment/:id', checkNotAuthenticated, async (req, res) => {
    const assignId = parseInt(req.params.id); // <-- This line defines assignId properly
  
    try {
      const assignment = await pool.query(
        `SELECT bus_id, driver_id, conductor_id FROM assignroute WHERE assign_id = $1`,
        [assignId]
      );
  
      if (assignment.rows.length === 0) {
        req.flash('error_msg', 'Assignment not found.');
        return res.redirect('/assign-routes');
      }
  
      const { bus_id, driver_id, conductor_id } = assignment.rows[0];
  
      await Promise.all([
        pool.query("UPDATE bus SET status = true WHERE bus_id = $1", [bus_id]),
        pool.query("UPDATE employee SET status = true WHERE emp_id = $1", [driver_id]),
        pool.query("UPDATE employee SET status = true WHERE emp_id = $1", [conductor_id])
      ]);
  
      await pool.query("DELETE FROM assignroute WHERE assign_id = $1", [assignId]);
  
      req.flash('success_msg', 'Assignment released successfully!');
      res.redirect('/assign-routes');
    } catch (err) {
      console.error("Error releasing assignment:", err);
      req.flash('error_msg', 'Failed to release assignment.');
      res.redirect('/assign-routes');
    }
  });
  

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});