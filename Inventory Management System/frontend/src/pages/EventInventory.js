import React, { useState, useEffect } from "react";
import { getEvents, updateEvent, deleteEvent, createEvent } from "../services/eventService";
import { Link } from "react-router-dom";
import "../styles/EventInventory.css";
import logo from "../assets/InnerVentory Button.png";
import logo2 from "../assets/BreastIntentionsLogo.png";
import { IoIosLogOut } from "react-icons/io";
import { logAction } from "../services/logService";
import { getBras } from "../services/braService";

const API_URL = 'http://localhost:5000/api/bras';

export const updateBra = async (braId, updateData) => {
  try {
    const response = await fetch(`${API_URL}/${braId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      throw new Error("Failed to update bra");
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating bra:", error);
  }
};

const EventInventory = () => {
  const role = localStorage.getItem("role");
  const [events, setEvents] = useState([]);
  const [editEventId, setEditEventId] = useState(null);
  const [editAttendeeId, setEditAttendeeId] = useState({
    eventIndex: null,
    attendeeIndex: null,
  });
  const [eventFormData, setEventFormData] = useState({ name: "", date: "" });
  const [newEventFormData, setNewEventFormData] = useState({
    name: "",
    date: "",
  });
  const [attendeeFormData, setAttendeeFormData] = useState({
    name: "",
    sizeBefore: "",
    sizeAfter: "",
    braSize1: "",
    braSize2: "",
    fitterName: "",
    phoneNumber: "",
    email: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchByEvent, setSearchByEvent] = useState(false);
  const [searchByAttendee, setSearchByAttendee] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [bras, setBras] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventData = await getEvents();
        setEvents(eventData || []);

        const brasData = await getBras();
        setBras(brasData || []);

        console.log("Fetched events and bras data successfully");
      } catch (error) {
        console.error("Error fetching events and bras data:", error);
      }
    };

    fetchData();
  }, []);

  const handleEventInputChange = (e) => {
    const { name, value } = e.target;
    setEventFormData({ ...eventFormData, [name]: value });
  };

  const handleNewEventInputChange = (e) => {
    const { name, value } = e.target;
    setNewEventFormData({ ...newEventFormData, [name]: value });
  };

  const handleCreateEvent = async () => {
    if (!newEventFormData.name || !newEventFormData.date) {
      setErrorMessage("Event name and date are required.");
      return;
    }

    await createEvent(newEventFormData);
    setNewEventFormData({ name: "", date: "" });
    const updatedEvents = await getEvents();
    setEvents(updatedEvents);
    setSuccessMessage("Event created successfully");
    setErrorMessage("");

    const formattedDate = new Date(newEventFormData.date).toLocaleDateString("en-US", { timeZone: "UTC" });
    logAction(localStorage.getItem("userId"), `Created a new event: ${newEventFormData.name} taking place on ${formattedDate}`);
  };

  const handleEditEvent = (eventId, event) => {
    setEditEventId(eventId);
    setEventFormData({
      name: event?.name || "",
      date: event?.date.split("T")[0] || "",
    });
  };

  const handleUpdateEvent = async () => {
    const originalEvent = events.find((event) => event._id === editEventId);

    if (!originalEvent) {
      console.error("Event not found for editing");
      return;
    }

    const originalEventDate = new Date(originalEvent.date).toISOString().split("T")[0];

    if (originalEvent.name === eventFormData.name && originalEventDate === eventFormData.date) {
      console.log("No changes made to event");
      setEditEventId(null);
      setEventFormData({ name: "", date: "" });
      return;
    }
    try {
      await updateEvent(editEventId, eventFormData);

      setEditEventId(null);
      setEventFormData({ name: "", date: "" });

      const updatedEvents = await getEvents();
      setEvents(updatedEvents);
      setSuccessMessage("Event updated successfully");

      const updatedEvent = updatedEvents.find((event) => event._id === editEventId);
      if (originalEvent && updatedEvent) {
        const formattedOriginalDate = new Date(originalEvent.date).toLocaleDateString("en-US", { timeZone: "UTC" });
        const formattedUpdatedDate = new Date(updatedEvent.date).toLocaleDateString("en-US", { timeZone: "UTC" });
        logAction(localStorage.getItem("userId"), `Updated event: ${originalEvent.name} taking place on ${formattedOriginalDate} to 
        ${updatedEvent.name} taking place on ${formattedUpdatedDate}`);
      }
    } catch (error) {
      console.error("Error updating event:", error);
      setErrorMessage("Failed to update event");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this event?"
    );
    if (isConfirmed) {

      const eventToDelete = events.find((event) => event._id === eventId);

      if (eventToDelete) {
        await deleteEvent(eventId);
        const updatedEvents = await getEvents();
        setEvents(updatedEvents);
        setSuccessMessage("Event deleted successfully");

        const formattedDate = new Date(eventToDelete.date).toLocaleDateString("en-US", { timeZone: "UTC" });
        logAction(localStorage.getItem("userId"), `Deleted event: ${eventToDelete.name} taking place on ${formattedDate}`);
      }
    }
  };

  const handleAttendeeInputChange = (e) => {
    const { name, value } = e.target;
    setAttendeeFormData({ ...attendeeFormData, [name]: value });
  };

  const handleAddAttendee = async (eventIndex) => {
    const updatedEvents = [...events];
    updatedEvents[eventIndex].attendees.push(attendeeFormData);
    await updateEvent(updatedEvents[eventIndex]._id, updatedEvents[eventIndex]);
    setAttendeeFormData({
      name: "",
      sizeBefore: "",
      sizeAfter: "",
      braSize1: "",
      braSize2: "",
      fitterName: "",
      phoneNumber: "",
      email: "",
    });
    setEvents(updatedEvents);
    setSuccessMessage("Attendee added successfully");

    const event = updatedEvents[eventIndex];
    const formattedDate = new Date(event.date).toLocaleDateString("en-US", { timeZone: "UTC" });

    logAction(localStorage.getItem("userId"), `Added an attendee to event: ${event.name} on ${formattedDate}`);
  };

  const handleEditAttendee = (eventIndex, attendeeIndex, attendee) => {
    setEditAttendeeId({ eventIndex, attendeeIndex });
    setAttendeeFormData({
      name: attendee?.name || "",
      sizeBefore: attendee?.sizeBefore || "",
      sizeAfter: attendee?.sizeAfter || "",
      braSize1: attendee?.braSize1 || "",
      braSize2: attendee?.braSize2 || "",
      fitterName: attendee?.fitterName || "",
      phoneNumber: attendee?.phoneNumber || "",
      email: attendee?.email || "",
    });
  };

  const handleUpdateAttendee = async () => {
    const { eventIndex, attendeeIndex } = editAttendeeId;
    const currentAttendee = events[eventIndex].attendees[attendeeIndex];

    if (!currentAttendee) {
      console.error("Attendee not found for editing");
      return;
    }

    const normalize = (value) => (value ? value.toString().trim() : "");

    const checkChange =
      normalize(currentAttendee.name) === normalize(attendeeFormData.name) &&
      normalize(currentAttendee.sizeBefore) === normalize(attendeeFormData.sizeBefore) &&
      normalize(currentAttendee.sizeAfter) === normalize(attendeeFormData.sizeAfter) &&
      normalize(currentAttendee.braSize1) === normalize(attendeeFormData.braSize1) &&
      normalize(currentAttendee.braSize2) === normalize(attendeeFormData.braSize2) &&
      normalize(currentAttendee.fitterName) === normalize(attendeeFormData.fitterName) &&
      normalize(currentAttendee.phoneNumber) === normalize(attendeeFormData.phoneNumber) &&
      normalize(currentAttendee.email) === normalize(attendeeFormData.email);

    console.log("checkChange: ", checkChange);

    if (checkChange) {
      console.log("No changes made to attendee");
      setEditAttendeeId({ eventIndex: null, attendeeIndex: null });
      setAttendeeFormData({
        name: "",
        sizeBefore: "",
        sizeAfter: "",
        braSize1: "",
        braSize2: "",
        fitterName: "",
        phoneNumber: "",
        email: "",
      });
      return;
    }

    const updatedEvents = [...events];
    updatedEvents[eventIndex].attendees[attendeeIndex] = attendeeFormData;
    await updateEvent(updatedEvents[eventIndex]._id, updatedEvents[eventIndex]);

    const oldBra1 = bras.find((bra) => normalize(`${bra.type} ${bra.size}`) === normalize(currentAttendee.braSize1));
    const oldBra2 = bras.find((bra) => normalize(`${bra.type} ${bra.size}`) === normalize(currentAttendee.braSize2));

    const selectedBra1 = bras.find((bra) => normalize(`${bra.type} ${bra.size}`) === normalize(attendeeFormData.braSize1));
    const selectedBra2 = bras.find((bra) => normalize(`${bra.type} ${bra.size}`) === normalize(attendeeFormData.braSize2));

    if (oldBra1) {
      await updateBra(oldBra1._id, { quantity: oldBra1.quantity + 1 });
    }
    if (oldBra2) {
      await updateBra(oldBra2._id, { quantity: oldBra2.quantity + 1 });
    }

    if (selectedBra1) {
      await updateBra(selectedBra1._id, { quantity: selectedBra1.quantity - 1 });
    }
    if (selectedBra2) {
      await updateBra(selectedBra2._id, { quantity: selectedBra2.quantity - 1 });
    }

    setEditAttendeeId({ eventIndex: null, attendeeIndex: null });
    setAttendeeFormData({
      name: "",
      sizeBefore: "",
      sizeAfter: "",
      braSize1: "",
      braSize2: "",
      fitterName: "",
      phoneNumber: "",
      email: "",
    });
    setEvents(updatedEvents);
    setSuccessMessage("Attendee updated successfully");

    const event = updatedEvents[eventIndex];
    const oldAttendee = currentAttendee;
    const newAttendee = attendeeFormData;

    const eventDate = new Date(event.date).toLocaleDateString("en-US", { timeZone: "UTC" });

    logAction(localStorage.getItem("userId"),
      `Updated attendee: ${oldAttendee.name || "Unnamed"} 
      (Size Before: ${oldAttendee.sizeBefore || "N/A"}, Size After: ${oldAttendee.sizeAfter || "N/A"},
      Bra 1: ${oldAttendee.braSize1 || "N/A"}, Bra 2: ${oldAttendee.braSize2 || "N/A"})
      to New details - 
      (Name: ${newAttendee.name || "N/A"}, Size Before: ${newAttendee.sizeBefore || "N/A"}, Size After: ${newAttendee.sizeAfter || "N/A"},
      Bra 1: ${newAttendee.braSize1 || "N/A"}, Bra 2: ${newAttendee.braSize2 || "N/A"}) 
      in Event: ${event.name} on ${eventDate}`);
  };

  const handleDeleteAttendee = async (eventIndex, attendeeIndex) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this attendee?"
    );

    if (isConfirmed) {
      const updatedEvents = [...events];
      const deletedAttendee = updatedEvents[eventIndex].attendees[attendeeIndex];

      updatedEvents[eventIndex].attendees.splice(attendeeIndex, 1);
      await updateEvent(
        updatedEvents[eventIndex]._id,
        updatedEvents[eventIndex]
      );
      setEvents(updatedEvents);
      setSuccessMessage("Attendee deleted successfully");

      const formattedDate = new Date(updatedEvents[eventIndex].date).toLocaleDateString("en-US", { timeZone: "UTC" });

      logAction(localStorage.getItem("userId"), `Deleted Attendee: ${deletedAttendee.name || "Unnamed"} from event: ${updatedEvents[eventIndex].name} on ${formattedDate}`);
    }
  };

  // Search events and attendees
  const filteredEvents = events
    .map((event) => {
      const eventMatches =
        searchByEvent &&
        event.name.toLowerCase().includes(searchTerm.toLowerCase());

      const filteredAttendees = searchByAttendee
        ? event.attendees.filter((attendee) =>
          attendee.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : event.attendees;

      const isVisible =
        eventMatches || (searchByAttendee && filteredAttendees.length > 0);

      return {
        ...event,
        attendees: isVisible ? filteredAttendees : event.attendees,
        isVisible,
      };
    })
    .filter(
      (event) =>
        event.isVisible || (!searchTerm && !searchByEvent && !searchByAttendee)
    );

  return (
    <div className="app">
      <header className="EventInventory-header">
        <div className="logo-container">
          <img src={logo} alt="Breast Intentions Logo" className="logo" />
          <img src={logo2} alt="Breast Intentions Logo" className="logo" />
        </div>
        <nav className="navbar">
          <Link to="/home" className="nav-link">
            Home
          </Link>
          <Link to="/bra-inventory" className="nav-link">
            Bra Inventory
          </Link>
          <Link to="/event-inventory" className="nav-link">
            Event Inventory
          </Link>
          <Link to="/two-fa" className="nav-link">
            2 FA Authentication
          </Link>
          <Link to="/logout" title="Logout">
            <IoIosLogOut size={25} />
          </Link>
        </nav>
      </header>

      <div className="main-content">
        <h1 className="event-inventory-title">
          Welcome to the Event Inventory
        </h1>
        <div className="search-section">
          <input
            type="text"
            className="search-input"
            placeholder="Search events or attendees"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="search-options">
            <label>
              <input
                type="checkbox"
                checked={searchByEvent}
                onChange={() => {
                  setSearchByEvent(true);
                  setSearchByAttendee(false);
                }}
              />
              Search by Event
            </label>
            <label>
              <input
                type="checkbox"
                checked={searchByAttendee}
                onChange={() => {
                  setSearchByAttendee(true);
                  setSearchByEvent(false);
                }}
              />
              Search by Attendee
            </label>
          </div>
        </div>

        <form
          className="event-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateEvent();
          }}
        >
          <h2>Add a New Event</h2>
          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                placeholder="Event Name"
                name="name"
                value={newEventFormData.name}
                onChange={handleNewEventInputChange}
                required
                className="form-input"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <input
                type="date"
                placeholder="Event Date"
                name="date"
                value={newEventFormData.date}
                onChange={handleNewEventInputChange}
                required
                className="form-input"
              />
            </div>
          </div>
          <button type="submit" className="submit-button">
            Add Event
          </button>
        </form>

        {successMessage && (
          <h3 style={{ textAlign: "center" }}>{successMessage}</h3>
        )}
        {errorMessage && <h3>{errorMessage}</h3>}

        <ul className="event-list">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, eventIndex) => (
              <li key={event._id} className="event-item">
                <div className="event-title-container">
                  <div className="event-title-and-actions">
                    {editEventId === event._id ? (
                      <>
                        <input
                          type="text"
                          name="name"
                          value={eventFormData.name}
                          onChange={handleEventInputChange}
                          placeholder="Event Name"
                          className="form-input"
                        />
                        <input
                          type="date"
                          name="date"
                          value={eventFormData.date}
                          onChange={handleEventInputChange}
                          className="form-input"
                        />
                      </>
                    ) : (
                      <>
                        <h3 className="event-title">
                          {event.name || "No event name"}
                        </h3>
                        <p className="event-date">
                          {new Date(event.date).toLocaleDateString("en-US", {
                            timeZone: "UTC",
                          })}
                        </p>
                      </>
                    )}

                    <div className="event-actions">
                      {editEventId === event._id ? (
                        <button onClick={handleUpdateEvent}>Update</button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditEvent(event._id, event)}
                          >
                            Edit
                          </button>
                          {role === "Admin" ? (
                            <button
                              onClick={() => handleDeleteEvent(event._id)}
                            >
                              Delete
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <ul className="attendee-list">
                  {event.attendees && event.attendees.length > 0 ? (
                    event.attendees.map((attendee, attendeeIndex) => (
                      <li key={attendeeIndex} className="attendee-item">
                        {editAttendeeId.eventIndex === eventIndex &&
                          editAttendeeId.attendeeIndex === attendeeIndex ? (
                          <>
                            <input
                              type="text"
                              name="name"
                              value={attendeeFormData.name}
                              onChange={handleAttendeeInputChange}
                              placeholder="Attendee Name"
                              className="form-input"
                            />
                            <input
                              type="text"
                              name="sizeBefore"
                              value={attendeeFormData.sizeBefore}
                              onChange={handleAttendeeInputChange}
                              placeholder="Size Before"
                              className="form-input"
                            />
                            <input
                              type="text"
                              name="sizeAfter"
                              value={attendeeFormData.sizeAfter}
                              onChange={handleAttendeeInputChange}
                              placeholder="Size After"
                              className="form-input"
                            />
                            <select
                              name="braSize1"
                              value={attendeeFormData.braSize1}
                              onChange={handleAttendeeInputChange}
                              className="form-input"
                            >
                              <option value="">Select Bra Size 1</option>
                              {bras.map((bra) => (
                                <option key={bra._id} value={`${bra.type} ${bra.size}`}>
                                  {bra.type} {bra.size} (Qty: {bra.quantity})
                                </option>
                              ))}
                            </select>
                            <select
                              name="braSize2"
                              value={attendeeFormData.braSize2}
                              onChange={handleAttendeeInputChange}
                              className="form-input"
                            >
                              <option value="">Select Bra Size 2</option>
                              {bras.map((bra) => (
                                <option key={bra._id} value={`${bra.type} ${bra.size}`}>
                                  {bra.type} {bra.size} (Qty: {bra.quantity})
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              name="fitterName"
                              value={attendeeFormData.fitterName}
                              onChange={handleAttendeeInputChange}
                              placeholder="Fitter Name"
                              className="form-input"
                            />
                            <input
                              type="text"
                              name="phoneNumber"
                              value={attendeeFormData.phoneNumber}
                              onChange={handleAttendeeInputChange}
                              placeholder="Phone Number"
                              className="form-input"
                            />
                            <input
                              type="email"
                              name="email"
                              value={attendeeFormData.email}
                              onChange={handleAttendeeInputChange}
                              placeholder="Email"
                              className="form-input"
                            />
                          </>
                        ) : (
                          <>
                            <p>
                              <strong>Name:</strong>{" "}
                              {attendee?.name ?? "No attendee name"}
                            </p>
                            <p>
                              <strong>Size Before:</strong>{" "}
                              {attendee?.sizeBefore ?? "No size before"}
                            </p>
                            <p>
                              <strong>Size After:</strong>{" "}
                              {attendee?.sizeAfter ?? "No size after"}
                            </p>
                            <p>
                              <strong>Bra Size 1:</strong>{" "}
                              {attendee?.braSize1 ?? "No bra size 1"}
                            </p>
                            <p>
                              <strong>Bra Size 2:</strong>{" "}
                              {attendee?.braSize2 ?? "No bra size 2"}
                            </p>
                            <p>
                              <strong>Fitter:</strong>{" "}
                              {attendee?.fitterName ?? "No fitter name"}
                            </p>
                            <p>
                              <strong>Phone:</strong>{" "}
                              {attendee?.phoneNumber ?? "No phone number"}
                            </p>
                            <p>
                              <strong>Email:</strong>{" "}
                              {attendee?.email ?? "No email"}
                            </p>
                          </>
                        )}

                        <div className="attendee-actions">
                          {editAttendeeId.eventIndex === eventIndex &&
                            editAttendeeId.attendeeIndex === attendeeIndex ? (
                            <button onClick={handleUpdateAttendee}>
                              Update Attendee
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  handleEditAttendee(
                                    eventIndex,
                                    attendeeIndex,
                                    attendee
                                  )
                                }
                              >
                                Edit
                              </button>
                              {role === "Admin" ? (
                                <button
                                  onClick={() =>
                                    handleDeleteAttendee(
                                      eventIndex,
                                      attendeeIndex
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              ) : null}
                            </>
                          )}
                        </div>
                        <div className="done-checkbox">
                          <label>
                            <input type="checkbox" />
                            Done
                          </label>
                        </div>
                      </li>
                    ))
                  ) : searchTerm && searchByAttendee ? (
                    <h2 style={{ textAlign: "center" }}>
                      No attendees of this name found.
                    </h2>
                  ) : null}
                  <button onClick={() => handleAddAttendee(eventIndex)}>
                    Add Attendee
                  </button>
                </ul>
              </li>
            ))
          ) : (
            <h2 style={{ textAlign: "center" }}>
              {searchByEvent
                ? "No events found."
                : "No attendees of this name found."}
            </h2>
          )}
        </ul>
      </div>
      <footer className="EventInventory-footer">
        <div className="footer-content">
          <p>&copy; 2024 Breast Intentions. All rights reserved.</p>
          <div className="social-links">
            <a
              href="https://www.facebook.com/breastintentionswa"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
            <a
              href="https://www.instagram.com/breastintentionsofwa/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EventInventory;
