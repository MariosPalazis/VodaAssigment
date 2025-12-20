🛠️ Installation Steps

    1️⃣ Clone the Project
        git clone <repo-url>
        cd VodaAssigment


        📂 Basic Folder Structure

        VodaAssigment
        │
        ├── README.md
        ├── client
        ├── server


    2️⃣ Install Frontend Dependencies
        cd ../server
        npm install

    3️⃣ Install Backend Dependencies
        cd ../server
        npm install

    4️⃣ Environment Variables
        Inside the server folder there is a .env.example file.
        Create a .env from it:
        Then open .env and update values:
        MONGO_URL=your-mongodb-connection-string
        TOKEN_SECRET=your-secret-key
        PORT=5000

🚀 Build & Run

    1️⃣ Build Frontend
        cd client
        npm run build
        -This generates client/dist, which is automatically served by the backend.-

    2️⃣ Build Backend
        cd ../server
        npm run build

    3️⃣ Start Backend (Serves UI + API)
        npm start (inside server folder)

    ✅ Access the Application
    Open in your browser:
    http://localhost:5000 (or any other port you may have put)


Design Decisions

    Server (Backend) Design Decisions

    On the server, the main decision was to separate responsibilities clearly: authentication is handled independently from posts, and likes are stored in their own collection instead of inside posts. This avoids complicated nested updates and makes permissions easier to enforce. Liking logic was implemented as idempotent (liking twice doesn’t create duplicates), and creating posts is restricted strictly to owners to avoid ambiguity. Pagination and optional liked-state enrichment were implemented on the server instead of the client so the API remains the single source of truth and can scale without UI assumptions.

    Client (Frontend) Design Decisions

    On the client, the most important decision was to keep the user flow predictable and lightweight. Authentication state is stored centrally so every page respects it, rather than verifying manually on each component. Instead of instantly redirecting users when they try restricted actions, the app shows a login modal to clearly communicate why the action is blocked and allow them to continue smoothly afterward. The UI intentionally avoids complex layouts so the focus stays on the main functionality.

    Database (MongoDB) Design Decisions

    For the database, posts, users, and likes were intentionally kept as separate collections instead of embedding likes inside posts. This makes it easier to query liked posts per user and avoids posts becoming very large documents. A uniqueness rule on (userId, postId) prevents duplicate reactions without extra business logic. Auto-seeding was chosen so the application always has meaningful data available without requiring manual setup, ensuring both development and review experiences remain smooth.


⭐ Bonus Features Implemented

    Filtering / Searching
        A search feature is implemented on the posts list. Users can search posts by title , using a contains-based search rather than only exact or prefix matching. This makes browsing large sets of posts much easier and more practical.

    Enhanced UI / UX
        The application includes a responsive and user-friendly interface. It provides login/register modals, confirmation dialogs (for actions like clearing likes), informative feedback modals for both success and failure states, and a clear 404 “Page Not Found” page. Protected actions do not fail silently: instead, users are prompted to authenticate when required, improving clarity and reducing confusion.

    Testing
        Automated tests are included for the backend using Mocha, Chai, and Supertest. These cover critical functionality such as post creation, deletion, likes handling, authentication enforcement, validation, and pagination. This helps ensure reliability and makes future changes safer.

    Performance & Scalability Enhancements
        While no formal caching layer was added, several design decisions were made with scalability in mind. Pagination was implemented on the backend so the API never returns the full dataset at once, which keeps responses lightweight and avoids unnecessary load as the number of posts grows. Additionally, likes were stored in a separate collection rather than embedded inside posts. This avoids large document growth, keeps updates efficient, and allows fast queries for user-specific liked content. Together, these choices help the application behave well as data volume increases.