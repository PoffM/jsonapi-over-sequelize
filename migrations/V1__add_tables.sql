create table departments(
  id serial primary key,
  name text not null
);

create table employees(
  id serial primary key,
  name text not null,
  dept_id int REFERENCES departments(id)
);
