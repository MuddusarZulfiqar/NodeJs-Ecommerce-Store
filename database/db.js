const mongoose = require('mongoose')
const dataBaseConnect = function(){
    const URI = process.env.DB_URL;
    mongoose.connect(URI, {
        useNewUrlParser: true, 
        // useUnifiedTopology: true 
        }).then(()=>{
            console.log('Connected to ' + URI);
    });
}

module.exports = dataBaseConnect