--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignroute; Type: TABLE; Schema: public; Owner: bus_database
--

CREATE TABLE public.assignroute (
    assign_id bigint NOT NULL,
    bus_id bigint NOT NULL,
    conductor_id bigint NOT NULL,
    driver_id bigint NOT NULL,
    route_id bigint NOT NULL,
    manager_id bigint NOT NULL,
    departure_time timestamp without time zone
);


ALTER TABLE public.assignroute OWNER TO bus_database;

--
-- Name: assignroute_assign_id_seq; Type: SEQUENCE; Schema: public; Owner: bus_database
--

CREATE SEQUENCE public.assignroute_assign_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignroute_assign_id_seq OWNER TO bus_database;

--
-- Name: assignroute_assign_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bus_database
--

ALTER SEQUENCE public.assignroute_assign_id_seq OWNED BY public.assignroute.assign_id;


--
-- Name: bus; Type: TABLE; Schema: public; Owner: bus_database
--

CREATE TABLE public.bus (
    bus_id bigint NOT NULL,
    capacity integer NOT NULL,
    status boolean DEFAULT true NOT NULL,
    serving_from date NOT NULL,
    dept_id bigint
);


ALTER TABLE public.bus OWNER TO bus_database;

--
-- Name: bus_bus_id_seq; Type: SEQUENCE; Schema: public; Owner: bus_database
--

CREATE SEQUENCE public.bus_bus_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bus_bus_id_seq OWNER TO bus_database;

--
-- Name: bus_bus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bus_database
--

ALTER SEQUENCE public.bus_bus_id_seq OWNED BY public.bus.bus_id;


--
-- Name: dept; Type: TABLE; Schema: public; Owner: bus_database
--

CREATE TABLE public.dept (
    dept_id bigint NOT NULL,
    name character varying(100) NOT NULL,
    manager_name character varying(100),
    manager_id bigint,
    email character varying(255) NOT NULL,
    password text NOT NULL
);


ALTER TABLE public.dept OWNER TO bus_database;

--
-- Name: dept_dept_id_seq; Type: SEQUENCE; Schema: public; Owner: bus_database
--

CREATE SEQUENCE public.dept_dept_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dept_dept_id_seq OWNER TO bus_database;

--
-- Name: dept_dept_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bus_database
--

ALTER SEQUENCE public.dept_dept_id_seq OWNED BY public.dept.dept_id;


--
-- Name: employee; Type: TABLE; Schema: public; Owner: bus_database
--

CREATE TABLE public.employee (
    emp_id bigint NOT NULL,
    name character varying(100) NOT NULL,
    dob date NOT NULL,
    gender character varying(10) NOT NULL,
    salary numeric(10,2) NOT NULL,
    job_title character varying(50) NOT NULL,
    contact character varying(20) NOT NULL,
    address text NOT NULL,
    hire_date date NOT NULL,
    dept_id bigint NOT NULL,
    status boolean NOT NULL,
    CONSTRAINT employee_gender_check CHECK (((gender)::text = ANY ((ARRAY['Male'::character varying, 'Female'::character varying])::text[]))),
    CONSTRAINT employee_job_title_check CHECK (((job_title)::text = ANY ((ARRAY['Conductor'::character varying, 'Driver'::character varying, 'Manager'::character varying])::text[])))
);


ALTER TABLE public.employee OWNER TO bus_database;

--
-- Name: employee_emp_id_seq; Type: SEQUENCE; Schema: public; Owner: bus_database
--

CREATE SEQUENCE public.employee_emp_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_emp_id_seq OWNER TO bus_database;

--
-- Name: employee_emp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bus_database
--

ALTER SEQUENCE public.employee_emp_id_seq OWNED BY public.employee.emp_id;


--
-- Name: route; Type: TABLE; Schema: public; Owner: bus_database
--

CREATE TABLE public.route (
    route_id bigint NOT NULL,
    from_loc character varying(100) NOT NULL,
    to_loc character varying(100) NOT NULL,
    distance numeric(10,2) NOT NULL,
    estimated_duration time without time zone NOT NULL,
    fare numeric(10,2)
);


ALTER TABLE public.route OWNER TO bus_database;

--
-- Name: route_route_id_seq; Type: SEQUENCE; Schema: public; Owner: bus_database
--

CREATE SEQUENCE public.route_route_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.route_route_id_seq OWNER TO bus_database;

--
-- Name: route_route_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bus_database
--

ALTER SEQUENCE public.route_route_id_seq OWNED BY public.route.route_id;


--
-- Name: assignroute assign_id; Type: DEFAULT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.assignroute ALTER COLUMN assign_id SET DEFAULT nextval('public.assignroute_assign_id_seq'::regclass);


--
-- Name: bus bus_id; Type: DEFAULT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.bus ALTER COLUMN bus_id SET DEFAULT nextval('public.bus_bus_id_seq'::regclass);


--
-- Name: dept dept_id; Type: DEFAULT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.dept ALTER COLUMN dept_id SET DEFAULT nextval('public.dept_dept_id_seq'::regclass);


--
-- Name: employee emp_id; Type: DEFAULT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.employee ALTER COLUMN emp_id SET DEFAULT nextval('public.employee_emp_id_seq'::regclass);


--
-- Name: route route_id; Type: DEFAULT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.route ALTER COLUMN route_id SET DEFAULT nextval('public.route_route_id_seq'::regclass);


--
-- Data for Name: assignroute; Type: TABLE DATA; Schema: public; Owner: bus_database
--

COPY public.assignroute (assign_id, bus_id, conductor_id, driver_id, route_id, manager_id, departure_time) FROM stdin;
5	5	20	19	3	16	2025-04-25 12:45:00
\.


--
-- Data for Name: bus; Type: TABLE DATA; Schema: public; Owner: bus_database
--

COPY public.bus (bus_id, capacity, status, serving_from, dept_id) FROM stdin;
4	90	t	2000-03-11	4
5	34	f	3122-02-12	6
\.


--
-- Data for Name: dept; Type: TABLE DATA; Schema: public; Owner: bus_database
--

COPY public.dept (dept_id, name, manager_name, manager_id, email, password) FROM stdin;
4	Bangalore	Ramesh	10	bangaloreStation@gmail.com	$2b$10$vqRhw1ovEysVsOazR6lfCumCiMgYM1FisoznAhIPvnq2Sj.Ti5O5G
5	Kolar	\N	\N	kolar@gmail.com	$2b$10$H/GtdiQlrSzxroEj2Ps4Ee96MW5E3TSJ2TguYm99.nbR3qvDbnZuy
6	Kundapura	Ratish	16	kundapura@gmail.com	$2b$10$XZVCDD9WzCPlyYElKON3t.Wmq/Q9pUN8Iak7tsGL00fraVoYXE2Vy
\.


--
-- Data for Name: employee; Type: TABLE DATA; Schema: public; Owner: bus_database
--

COPY public.employee (emp_id, name, dob, gender, salary, job_title, contact, address, hire_date, dept_id, status) FROM stdin;
10	Ramesh	1966-06-12	Male	90000.00	Manager	6360407668	Malleshwaram Bangalore	1995-03-12	4	t
11	Suresh	1986-06-11	Male	60000.00	Driver	12345	HSR layout	2000-03-12	4	t
12	Mukesh	1987-10-07	Female	60000.00	Conductor	09875	Dairy Circle Bangalore	2000-03-12	4	t
13	Veeresh	1984-07-03	Male	70000.00	Driver	3557673	KR circle Bangalore	2000-10-20	4	t
16	Ratish	2004-09-12	Male	90000.00	Manager	6789876	cvoiuh	0988-12-31	6	t
19	Shree hari N G	0004-03-12	Male	34513.00	Driver	67754463	21324t3	0004-03-12	6	f
20	Priyanka	4567-03-12	Male	23456.00	Conductor	23455y43	12324t5y	0056-04-23	6	f
\.


--
-- Data for Name: route; Type: TABLE DATA; Schema: public; Owner: bus_database
--

COPY public.route (route_id, from_loc, to_loc, distance, estimated_duration, fare) FROM stdin;
3	Mysore	Bangalore	120.00	03:00:00	120.00
\.


--
-- Name: assignroute_assign_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bus_database
--

SELECT pg_catalog.setval('public.assignroute_assign_id_seq', 5, true);


--
-- Name: bus_bus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bus_database
--

SELECT pg_catalog.setval('public.bus_bus_id_seq', 5, true);


--
-- Name: dept_dept_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bus_database
--

SELECT pg_catalog.setval('public.dept_dept_id_seq', 6, true);


--
-- Name: employee_emp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bus_database
--

SELECT pg_catalog.setval('public.employee_emp_id_seq', 20, true);


--
-- Name: route_route_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bus_database
--

SELECT pg_catalog.setval('public.route_route_id_seq', 3, true);


--
-- Name: assignroute assignroute_pkey; Type: CONSTRAINT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.assignroute
    ADD CONSTRAINT assignroute_pkey PRIMARY KEY (assign_id);


--
-- Name: bus bus_pkey; Type: CONSTRAINT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.bus
    ADD CONSTRAINT bus_pkey PRIMARY KEY (bus_id);


--
-- Name: dept dept_email_key; Type: CONSTRAINT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.dept
    ADD CONSTRAINT dept_email_key UNIQUE (email);


--
-- Name: dept dept_manager_id_key; Type: CONSTRAINT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.dept
    ADD CONSTRAINT dept_manager_id_key UNIQUE (manager_id);


--
-- Name: dept dept_pkey; Type: CONSTRAINT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.dept
    ADD CONSTRAINT dept_pkey PRIMARY KEY (dept_id);


--
-- Name: employee employee_contact_key; Type: CONSTRAINT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_contact_key UNIQUE (contact);


--
-- Name: employee employee_pkey; Type: CONSTRAINT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_pkey PRIMARY KEY (emp_id);


--
-- Name: route route_pkey; Type: CONSTRAINT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.route
    ADD CONSTRAINT route_pkey PRIMARY KEY (route_id);


--
-- Name: assignroute assignroute_conductor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.assignroute
    ADD CONSTRAINT assignroute_conductor_id_fkey FOREIGN KEY (conductor_id) REFERENCES public.employee(emp_id) ON DELETE CASCADE;


--
-- Name: assignroute assignroute_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.assignroute
    ADD CONSTRAINT assignroute_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.employee(emp_id) ON DELETE CASCADE;


--
-- Name: assignroute assignroute_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.assignroute
    ADD CONSTRAINT assignroute_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.employee(emp_id) ON DELETE CASCADE;


--
-- Name: assignroute assignroute_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.assignroute
    ADD CONSTRAINT assignroute_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.route(route_id) ON DELETE CASCADE;


--
-- Name: bus bus_dept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.bus
    ADD CONSTRAINT bus_dept_id_fkey FOREIGN KEY (dept_id) REFERENCES public.dept(dept_id);


--
-- Name: employee employee_dept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bus_database
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_dept_id_fkey FOREIGN KEY (dept_id) REFERENCES public.dept(dept_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

