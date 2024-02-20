const Note = require("../models/Note");
const User = require("../models/User");
const asycnHandler = require("express-async-handler");

// @desc GET all notes
// @route GET /notes
// @access Private
const getAllNotes = asycnHandler(async (req, res) => {
  // get all notes from MongoDB
  const notes = await Note.find().lean();

  // if no notes
  if (!notes?.length) {
    return res.status(400).json({ message: "No notes found" });
  }

  // Add username to each note before sending the response
  const notesWithUser = await Promise.all(
    notes.map(async (note) => {
      const user = await User.findById(note.user).lean().exec();
      return { ...note, username: user.username };
    })
  );

  res.json(notesWithUser);
});

// @desc CREATE a note
// @route POST /notes
// @access Private
const createNote = asycnHandler(async (req, res) => {
  const { user, title, text } = req.body;

  // confirm data
  if (!user || !title || !text) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // check for duplicate
  const duplicate = await Note.findOne({ title }).lean().exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate note title" });
  }

  // create and save new note
  const note = await Note.create({ user, title, text });

  if (note) {
    return res.status(201).json({ message: "New note created" });
  } else {
    return res.status(400).json({ message: "Invalid note data received" });
  }
});

// @desc UPDATE a note
// @route PATCH /notes
// @access Private
const updateNote = asycnHandler(async (req, res) => {
  const { id, user, title, text, completed } = req.body;

  // confirm data
  if (!id || !user || !title || !text || typeof completed !== "boolean") {
    return res.status(400).json({ message: "All fields are required" });
  }
  const note = await Note.findById(id).exec();

  if (!note) {
    return res.status(400).json({ message: "User not found" });
  }

  // check for duplicate
  const duplicate = await Note.findOne({ title }).lean().exec();
  // Allow updates to the original note
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate note title" });
  }

  note.title = title;
  note.user = user;
  note.text = text;
  note.completed = completed;

  const updatedNote = await note.save();

  res.json({ message: `${updatedNote.title} updated` });
});

// @desc DELETE a note
// @route DELETE /notes
// @access Private
const deleteNote = asycnHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Note ID Required" });
  }

  const note = await Note.findById(id).exec();

  if (!note) {
    return res.status(400).json({ message: "Note not found" });
  }

  const result = await note.deleteOne();

  const reply = `Note ${result.title} with ID ${result._id} deleted`;

  res.json(reply);
});

module.exports = {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
};
