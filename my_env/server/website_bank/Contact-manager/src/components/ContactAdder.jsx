import React, { useState } from "react";

const ContactAdder = (props) => {
  const [name, setName] = useState("");
  const [num, setNum] = useState("");
  const [location, setLocation] = useState("");

  const onClickHandler = () => {
    const contactdata_obj = {
      id: Math.random(),
      name: name,
      number: num,
      location: location,
    };
    props.onContactAdded(contactdata_obj);
    localStorage.setItem("name", "value");
  };

  return (
    <>
      <div className="input_fields">
        <h2>Add Contact</h2>
        <br />
        <input
          type="text"
          value={name}
          placeholder="Name"
          onChange={(e) => setName(e.target.value)}
        />
        <br /> <br />
        <input
          type="text"
          value={num}
          placeholder="Phone Number"
          onChange={(e) => setNum(e.target.value)}
        />
        <br /> <br />
        <input
          type="text"
          value={location}
          placeholder="Location"
          onChange={(e) => setLocation(e.target.value)}
        />
        <br />
        <br />
        <button onClick={onClickHandler}>Add Contact</button>
      </div>
    </>
  );
};
export default ContactAdder;
