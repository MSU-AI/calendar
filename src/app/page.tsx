// src/app/page.tsx
"use client";

import type { NextPage } from 'next';
import CalendarComponent from './CalendarComponent';

const Home: NextPage = () => {
  return (
    <div>
      <h1>My Calendar</h1>
      <CalendarComponent />
    </div>
  );
};

export default Home;