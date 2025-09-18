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

export default app;