import React, { useState } from "react";
import Contact from "./components/Contact.jsx";
import "./styles/app.css";
import ContactAdder from "./components/ContactAdder.jsx";
import NavBar from "./components/NavBar.jsx";
import { SearchIcon } from "lucide-react";
function App() {
  const getContacts = JSON.parse(localStorage.getItem("contact_obj"));
  const [contact_obj, setContact_obj] = useState(
    getContacts ? getContacts : []
  );

  const addContactsData = (contactdata_obj) => {
    setContact_obj([...contact_obj, contactdata_obj]);
    localStorage.setItem(
      "contact_obj",
      JSON.stringify([...contact_obj, contactdata_obj])
    );
  };

  const editContact = (id, updatedData) => {
    const updatedContacts = contact_obj.map((contact) =>
      contact.id === id ? { ...contact, ...updatedData } : contact
    );
    setContact_obj(updatedContacts);
    localStorage.setItem("contact_obj", JSON.stringify(updatedContacts));
  };

  const deleteContact = (id) => {
    localStorage.removeItem("name");
    const updatedContacts = contact_obj.filter((contact) => contact.id !== id);
    setContact_obj(updatedContacts);
    localStorage.setItem("contact_obj", JSON.stringify(updatedContacts));
  };
  return (
    <>
      <NavBar />
      <div className="flex_container">
        <div className="contact_adder">
          <ContactAdder onContactAdded={addContactsData} />
        </div>

        <div className="contact_list">
          <h2>Available Contact list</h2>
          <input
            type="text"
            placeholder="Search Contact"
            className="search_input"
          />

          <table id="contacts_table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contact_obj.map((data) => (
                <Contact
                  key={data.id}
                  data={data}
                  onDelete={deleteContact}
                  onEdit={editContact}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default App;
