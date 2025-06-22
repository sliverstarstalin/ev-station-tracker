// src/components/Primitives.jsx
import React from 'react';

export const Input = ({ className = '', ...props }) => (
  <input {...props} className={`px-3 py-2 border rounded ${className}`} />
);

export const Button = ({ className = '', ...props }) => (
  <button {...props} className={`px-4 py-2 bg-blue-600 text-white rounded ${className}`} />
);

export const Card = ({ className = '', ...props }) => (
  <div {...props} className={`border rounded-lg shadow ${className}`} />
);

export const CardContent = ({ className = '', ...props }) => (
  <div {...props} className={`p-4 ${className}`} />
);
