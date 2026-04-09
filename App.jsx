import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Firebase
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allocations, setAllocations] = useState([]);

  const [projectForm, setProjectForm] = useState({ name: "", owner: "", billing: "" });
  const [employeeForm, setEmployeeForm] = useState({ name: "", role: "", expertise: "", billRate: "" });
  const [allocationForm, setAllocationForm] = useState({ employee: "", project: "", percent: "" });

  useEffect(() => {
    const fetchData = async () => {
      const projSnap = await getDocs(collection(db, "projects"));
      setProjects(projSnap.docs.map(doc => doc.data()));

      const empSnap = await getDocs(collection(db, "employees"));
      setEmployees(empSnap.docs.map(doc => doc.data()));

      const allocSnap = await getDocs(collection(db, "allocations"));
      setAllocations(allocSnap.docs.map(doc => doc.data()));
    };
    fetchData();
  }, []);

  const addProject = async () => {
    await addDoc(collection(db, "projects"), projectForm);
    setProjects([...projects, projectForm]);
    setProjectForm({ name: "", owner: "", billing: "" });
  };

  const addEmployee = async () => {
    await addDoc(collection(db, "employees"), employeeForm);
    setEmployees([...employees, employeeForm]);
    setEmployeeForm({ name: "", role: "", expertise: "", billRate: "" });
  };

  const addAllocation = async () => {
    await addDoc(collection(db, "allocations"), allocationForm);
    setAllocations([...allocations, allocationForm]);
    setAllocationForm({ employee: "", project: "", percent: "" });
  };

  const calculateUtilization = () => {
    const result = {};
    employees.forEach(emp => {
      const empAlloc = allocations.filter(a => a.employee === emp.name);
      const total = empAlloc.reduce((sum, a) => sum + Number(a.percent), 0);
      result[emp.name] = total;
    });
    return Object.entries(result).map(([name, utilization]) => ({ name, utilization }));
  };

  const data = calculateUtilization();

  const overallUtil = data.length
    ? Math.round(data.reduce((sum, d) => sum + d.utilization, 0) / data.length)
    : 0;

  const bench = data.filter(d => d.utilization < 30).length;

  return (
    <div style={{ padding: 20 }}>
      <h1>Resource Utilization Dashboard</h1>

      <h2>Add Project</h2>
      <input placeholder="Project Name" value={projectForm.name} onChange={(e)=>setProjectForm({...projectForm,name:e.target.value})} />
      <input placeholder="Owner" value={projectForm.owner} onChange={(e)=>setProjectForm({...projectForm,owner:e.target.value})} />
      <input placeholder="Billing" value={projectForm.billing} onChange={(e)=>setProjectForm({...projectForm,billing:e.target.value})} />
      <button onClick={addProject}>Add</button>

      <h2>Add Employee</h2>
      <input placeholder="Name" value={employeeForm.name} onChange={(e)=>setEmployeeForm({...employeeForm,name:e.target.value})} />
      <input placeholder="Role" value={employeeForm.role} onChange={(e)=>setEmployeeForm({...employeeForm,role:e.target.value})} />
      <input placeholder="Expertise" value={employeeForm.expertise} onChange={(e)=>setEmployeeForm({...employeeForm,expertise:e.target.value})} />
      <input placeholder="Bill Rate" value={employeeForm.billRate} onChange={(e)=>setEmployeeForm({...employeeForm,billRate:e.target.value})} />
      <button onClick={addEmployee}>Add</button>

      <h2>Add Allocation</h2>
      <input placeholder="Employee Name" value={allocationForm.employee} onChange={(e)=>setAllocationForm({...allocationForm,employee:e.target.value})} />
      <input placeholder="Project" value={allocationForm.project} onChange={(e)=>setAllocationForm({...allocationForm,project:e.target.value})} />
      <input placeholder="% Allocation" value={allocationForm.percent} onChange={(e)=>setAllocationForm({...allocationForm,percent:e.target.value})} />
      <button onClick={addAllocation}>Add</button>

      <h2>KPIs</h2>
      <p>Overall Utilization: {overallUtil}%</p>
      <p>Bench Count: {bench}</p>
      <p>Total Employees: {employees.length}</p>

      <h2>Utilization Chart</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="utilization" />
        </BarChart>
      </ResponsiveContainer>

      <h2>Insights</h2>
      <ul>
        {overallUtil < 70 && <li>Low utilization → Need more projects</li>}
        {overallUtil > 85 && <li>High utilization → Hire more</li>}
        {bench > 0 && <li>{bench} employees on bench → Allocate resources</li>}
      </ul>
    </div>
  );
}
