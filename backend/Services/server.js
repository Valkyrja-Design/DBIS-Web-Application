
const express = require('express');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const bcrypt = require("bcrypt")
const cors= require('cors');
const { Client } = require('pg')
const config = require('../config');

const client = new Client(config.database)
const connectClient=async()=>{
    await client     
        .connect()
        .catch(
            (err)=>{
                console.log(err)
            }
        )
}
const disconnectClient=async()=>{
    await client.end();
}

connectClient();
const app = express();
const PORT = 4000;
app.use(cors({
    origin:'http://localhost:3000',
    credentials:true
}));
const oneDay = 1000 * 60 * 60 * 24;

app.use(sessions({
    secret: "env_file_secret_key", //to be updted later
    saveUninitialized:true,
    cookie: { 
        maxAge: oneDay
    },
    resave: false 
}));

// parsing the incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//serving public file
app.use(express.static(__dirname));
app.use(cookieParser());


app.post('/verifyLogin', async(req,res) => {
    const result = await client.query(`SELECT * from user_password where id='${req.body.username}'`)
    if(result.rowCount>0){
        let i;
        for (i=0;i<result.rowCount;i++){
            let temp=false;
            await bcrypt
                .compare(req.body.password, result.rows[i].hashed_password)
                .then(r => {
                    if(r==true){
                        req.session.username=req.body.username
                        req.session.save()
                        res.send({valid:1, msg:"Successful Log"});
                        temp=true;
                    }
                })
                .catch(err => console.error(err.message))
            if(temp){
                break;
            }
        }
        
        if(i==result.rowCount){
            res.send({valid:0, msg:"Invalid data"});
        }
    }
    else{
        res.send({valid:0, msg:"Invalid data"});
    }
})

app.get("/validSession",(req,res)=>{
    try {
        var session=req.session;
        // console.log(req.session)
        if(session.username){
            // console.log("session", true)
            res.send({session:true, username:req.session.username})
        }
        else{
            // console.log("session", false)
            res.send({session:false})
        }
    } catch (error) {
        console.log(error);
    }
})

app.get("/destroySession",(req,res)=>{
    req.session.destroy();
    res.send({success:true})
})

app.get("/getAllDepartments", async(req,res)=>{
    const result = await client.query("select distinct dept_name from department")
})
app.get("/getName", async(req,res)=>{
    let uname=req.session.username
    if(uname){
        const user_name = await client.query(`select name from student where id='${uname}'`)
        res.send({name: user_name.rows[0].name})
    }
    else{
        res.status(401).send({session:false})
    }
})
app.get("/getStudentData", async(req,res)=>{
    let uname=req.session.username

    if(uname){
        //check if instructor id
        const result = await client.query(`select distinct * from instructor where ID ='${uname}'`)
        // console.log(result)
        if(result.rowCount>0){
            res.send({data:await client.query(`select distinct * from student`)}) //send complete student data
        }
        else{
            const res1 = await client.query(`select distinct * from student where ID ='${uname}'`)
            const res2 = await client.query(`select * from takes,course where ID ='${uname}' and 
                                            takes.course_id=course.course_id order by takes.year desc, 
                                            (case semester 
                                                when 'Spring' then 1
                                                when 'Summer' then 2
                                                when 'Fall' then 3
                                                when 'Winter' then 4
                                                end)`)
            res.send({basic:res1, courses:res2})
        }
    }
    else{
        res.status(401).send({session:false})
    }

})

app.post("/deleteCourse", async(req,res)=>{
    let uname=req.session.username
    
    if(uname){
        const res1 = await client.query(`delete from takes where ID ='${uname}' and course_id='${req.body.course_id}' and sec_id='${req.body.section_id}' and semester='${req.body.semester}' and year=${req.body.year}`)
        // console.log(res1)
        res.send({success:true})
    }
    else{
        res.status(401).send({session:false})
    }
})
app.post("/getRunningCourses", async(req, res)=>{
    let uname=req.session.username
    let curr_year= req.body.curr_year
    let curr_sem=req.body.curr_sem
    if(uname){
        const user_name = await client.query(`select name from student where id='${uname}'`)
        // console.log(user_name)
        // console.log(`select * from section,course where semester='${curr_sem}' and year=${curr_year} and section.course_id=course.course_id`)
        const res1 = await client.query(`select * from section, course where semester='${curr_sem}' and year=${curr_year} and section.course_id=course.course_id`)
        // console.log(res1)
        res.send({name: user_name.rows[0].name, running_courses: res1})
    }
    else{
        res.status(401).send({session:false})
    }
})
app.post("/register",async(req,res)=>{
    let uname=req.session.username
    if(uname){
        let course_id=req.body.course_id
        let sec_id=req.body.sec_id
        let curr_sem=req.body.curr_sem
        let curr_year=req.body.curr_year
        // console.log(course_id, sec_id, curr_sem, curr_year)
        const taken = await client.query(`select * from takes where id='${uname}' and course_id='${course_id}' and sec_id='${sec_id}' and semester='${curr_sem}' and year=${curr_year}`)
        if(taken.rowCount>0){
            res.send({alreadyTaken: true})
        }
        else{
            const pre_req = await client.query(`SELECT DISTINCT prereq_id FROM prereq WHERE course_id='${course_id}'`)
            const pre_req_taken = await client.query(`SELECT DISTINCT takes.course_id FROM takes INNER JOIN 
                                                    (SELECT DISTINCT prereq_id FROM prereq WHERE course_id = '${course_id}') as prereqs
                                                    ON takes.course_id = prereqs.prereq_id;`)

            if (pre_req.rowCount != pre_req_taken.rowCount){
                // console.log(pre_req)
                res.send({pre_req_fail: true})
            } else{
                const clash = await client.query(`
                        SELECT * FROM takes NATURAL JOIN section WHERE semester = '${curr_sem}' AND year = '${curr_year}'
                        AND ID = '${uname}' AND time_slot_id = (SELECT time_slot_id FROM section 
                        WHERE (course_id, sec_id, semester, year) = ('${course_id}', '${sec_id}', '${curr_sem}', '${curr_year}')
                                            )`)
                // console.log(clash.rows)
                if (clash.rowCount){
                    res.send({slot_clashes: true})
                } else{
                    res.send({success: true})
                    const query = await client.query(`INSERT INTO takes 
                                                    values('${uname}', '${course_id}', '${sec_id}', '${curr_sem}', '${curr_year}', null)`)
                    // console.log(query)
                }
            }
        }
    }
    else{
        res.status(401).send({session:false})
    }
})

app.post("/getRunningDepartments", async(req,res)=>{
    let uname=req.session.username
    if(uname){
        const response=await client.query(`select distinct dept_name from section,course where section.course_id=course.course_id and semester='${req.body.cur_sem}' and year=${req.body.cur_year}`);
        res.send(response)
    }
    else{
        res.status(401).send({session:false})
    }
})

app.post("/getDepartmentCourses", async(req,res)=>{
    let uname=req.session.username
    if(uname){
        const response=await client.query(`select distinct section.course_id,title from section,course where section.course_id=course.course_id and semester='${req.body.cur_sem}' and year=${req.body.cur_year} and dept_name='${req.body.dept_name}'`);
        res.send(response)
    }
    else{
        res.status(401).send({session:false})
    }
})

app.post("/getCourseInfo", async(req,res)=>{
    let uname=req.session.username
    if(uname){
        // console.log(req.body)
        const course_data= await client.query(`select * from course where course_id='${req.body.courseId}'`)
        const prereqs=await client.query(`select distinct prereq_id,title from prereq,course where prereq.course_id='${req.body.courseId}' and prereq.prereq_id=course.course_id`);
        const instructors=await client.query(`select distinct teaches.id,name from teaches,instructor where teaches.id=instructor.id and course_id='${req.body.courseId}' and semester='${req.body.curr_sem}' and year=${req.body.curr_year}`);
        
        res.send({course_data:course_data,prereq:prereqs, instructors:instructors})
    }
    else{
        res.status(401).send({session:false})
    }
})

app.post("/getInstructorInfo", async(req,res)=>{
    let uname=req.session.username
    if(uname){
        const inst_data=await client.query(`select * from instructor where id='${req.body.inst_id}'`)
        const cur_course_data=await client.query(`select * from instructor,teaches,course where instructor.id='${req.body.inst_id}' and teaches.id=instructor.id and course.course_id=teaches.course_id and semester='${req.body.cur_sem}' and year=${req.body.cur_year} order by teaches.course_id`)
        const prev_course_data=await client.query(` select * from instructor,teaches,course 
                                                    where instructor.id='${req.body.inst_id}' and teaches.id=instructor.id and course.course_id=teaches.course_id and (semester!='${req.body.cur_sem}' or year!=${req.body.cur_year}) 
                                                    order by year desc, 
                                                    (case semester 
                                                        when 'Spring' then 1
                                                        when 'Summer' then 2
                                                        when 'Fall' then 3
                                                        when 'Winter' then 4
                                                        end)`)
        res.send({inst_data:inst_data, cur_course_data:cur_course_data, prev_course_data:prev_course_data})
    }
    else{
        res.status(401).send({session:false})
    }
})

app.get("/getCurrSemester", async(req,res)=>{
    let uname=req.session.username
    if(uname){
        const resp=await client.query(`select * from reg_dates where start_time<now() and start_time>=all(select start_time from reg_dates where start_time<now())`)
        res.send({curr_year:resp.rows[0].year, curr_sem:resp.rows[0].semester})
    }
    else{
        res.status(401).send({session:false})
    }
})

// select distinct section.course_id,title  from section,course where section.course_id=course.course_id and semester='Spring' and year=2008 and dept_name='Finance';
app.listen(PORT, () => console.log(`Server Running at port ${PORT}`));
