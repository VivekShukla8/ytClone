import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();

app.use(cors({
  origin:process.env.CORS_ORIGIN,
  credentials:true,
}))

app.use(express.json({limit: "56kb" }))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from  "./routes/user.routes.js"

//routes declaration
app.use("/api/v1/users",userRouter)

// video routes
import videoRouter from "./routes/video.routes.js"
app.use("/api/v1/videos", videoRouter);

// comment routes
import commentRouter from "./routes/comment.routes.js"
app.use("/api/v1/comments", commentRouter);

// Tweet routes
import tweetRouter from "./routes/tweeets.routes.js"
app.use("/api/v1/tweets",tweetRouter)

// Subscription routes
import subscriptionRouter from "./routes/subscription.routes.js"
app.use("/api/v1/subscriptions",subscriptionRouter)

// Likes routes
import likesRouter from "./routes/likes.routes.js";
app.use("/api/v1/likes", likesRouter);

// Healthcheck route
import healthcheckRouter from "./routes/healthcheck.routes.js";
app.use("/api/v1/healthcheck", healthcheckRouter);

// Playlist routes
import playlistRouter from "./routes/playlist.routes.js";
app.use("/api/v1/playlists", playlistRouter);

// Dashboard/Channel routes
import channelRouter from "./routes/channels.routes.js";
app.use("/api/v1/channel", channelRouter);

// Search routes
import searchRoutes from "./routes/search.routes.js";
app.use("/api/v1/search", searchRoutes);


export default app;