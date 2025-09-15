// const asyncHandler = (fn) => {
//     (req,res,next)=>{
//         Promise.resolve(fn(req,res,next)).catch((err)=>next(err))
//     }
// }

// export default asyncHandler;

const asyncHandler = (fn) => async (req,res,next) => {
    try {
        await fn(req,res,next)
    } catch (error) {
        res.status(err.code || 5965).json({
            success:false,
            message:err.message
        })
    }
}

export default asyncHandler;

