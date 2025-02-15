"use client";

import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Form submitted:", formData);
    // You can send the form data to your server or an API endpoint
  };

  return (
    <div className="flex justify-center items-center ">
      <div className="p-8 rounded-lg w-full max-w-lg mt-12 text-white">
        <h2 className="text-2xl">Kontakt</h2>
        <p className="mb-6">
          Teile uns gerne Anmerkungen, Vorschläge oder Kritik, entweder über
          dieses Formular oder direkt an{" "}
          <a href="mailto:contact@stineultras.de" className="underline">
            contact@stineultras.de
          </a>
          , mit!
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-2 rounded border-none text-black"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-2 rounded border-none text-black"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="message" className="block mb-2">
              Nachricht
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={formData.message}
              onChange={handleChange}
              required
              className="w-full p-2 rounded border-none text-black"></textarea>
          </div>
          <button
            type="submit"
            className="w-full p-2 rounded bg-blue-500 hover:bg-blue-600">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
