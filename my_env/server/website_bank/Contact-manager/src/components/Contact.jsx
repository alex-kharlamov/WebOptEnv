// import { Edit, Trash2 } from "lucide-react";
// const Contact = (props) => {
//   const editData = () => {
    
//   };

//   const handleDelete = () => {
//     props.onDelete(props.data.id);
//   };

//   return (
//     <tr>
//       <td>{props.data.name}</td>
//       <td>{props.data.number}</td>
//       <td>{props.data.location}</td>
//       <td>
//         <div className="action_buttons">
//           <button onClick={editData} className="edit_button">
//             Edit
//             <Edit size={22} />
//           </button>
//           <button onClick={handleDelete} className="delete_button">
//             Delete
//             <Trash2 size={22} />
//           </button>
//         </div>
//       </td>
//     </tr>
//   );
// };

// export default Contact;
import { Edit, Trash2, Save, X } from "lucide-react";
import { useState } from "react";

const Contact = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    name: props.data.name,
    number: props.data.number,
    location: props.data.location
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    props.onEdit(props.data.id, editedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData({
      name: props.data.name,
      number: props.data.number,
      location: props.data.location
    });
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setEditedData({
      ...editedData,
      [e.target.name]: e.target.value
    });
  };

  const handleDelete = () => {
    props.onDelete(props.data.id);
  };

  return (
    <tr>
      {isEditing ? (
        <>
          <td>
            <input
              type="text"
              name="name"
              value={editedData.name}
              onChange={handleChange}
              className="edit_input"
            />
          </td>
          <td>
            <input
              type="text"
              name="number"
              value={editedData.number}
              onChange={handleChange}
              className="edit_input"
            />
          </td>
          <td>
            <input
              type="text"
              name="location"
              value={editedData.location}
              onChange={handleChange}
              className="edit_input"
            />
          </td>
          <td>
            <div className="action_buttons">
              <button onClick={handleSave} className="save_button">
                Save
                <Save size={22} />
              </button>
              <button onClick={handleCancel} className="cancel_button">
                Cancel
                <X size={22} />
              </button>
            </div>
          </td>
        </>
      ) : (
        <>
          <td>{props.data.name}</td>
          <td>{props.data.number}</td>
          <td>{props.data.location}</td>
          <td>
            <div className="action_buttons">
              <button onClick={handleEdit} className="edit_button">
                Edit
                <Edit size={22} />
              </button>
              <button onClick={handleDelete} className="delete_button">
                Delete
                <Trash2 size={22} />
              </button>
            </div>
          </td>
        </>
      )}
    </tr>
  );
};

export default Contact;