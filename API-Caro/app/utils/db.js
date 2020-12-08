const mysql = require('mysql');

function connectToSring() {
    return mysql.createConnection({
        host: 'us-cdbr-east-02.cleardb.com',
        port: '3306',
        user: 'b1ab1f3a85df79',
        password: 'd8649255',
        database: 'heroku_f817e655e2715a5'
    });
}

exports.load = sql => {
    return new Promise((resolve, reject) => {
        //throw new Error(' just happen right now :(');
        const con = connectToSring();
        con.connect(err => {
            if (err) {
                reject(err);
            }
            ////console.log("Connected!");
        });
        con.query(sql, (error, results, fields) => {
            if (error) {
                console.log(error)
                reject(error);
            }
            resolve(results);
        });
        con.end();
    });
};
exports.del = (tbName, idField, id) => {
    return new Promise((resolve, reject) => {
        const con = connectToSring();
        con.connect(err => {
            if (err) {
                reject(err);
            }
            ////console.log("Connected!");
        });
        let sql = 'delete from ?? where ?? = ?';
        const params = [tbName, idField, id];
        sql = mysql.format(sql, params);
        console.log(sql);
        con.query(sql, (error, results, fields) => {
            if (error) {
                reject(error);
            }
            resolve(results.affectedRows);
        });
        con.end();
    });
};
exports.update = (tbName, idField, entity) => {
    return new Promise((resolve, reject) => {
        const con = connectToSring();
        con.connect(err => {
            if (err) {
                reject(err);
            }
            ////console.log("Connected!");
        });
        const id = entity[idField];
        delete entity[idField];
        let sql = `update ${tbName} set ? where ${idField}=${id}`;
        con.query(sql, entity, (error, results, fields) => {
            if (error) {
                reject(error);
            }
            resolve(results.changedRows);
        });
        con.end();
    })
}
exports.add = (tbName, entity) => {
    return new Promise((resolve, reject) => {
        const con = connectToSring();
        con.connect(err => {
            if (err) {
                reject(err);
            }
            //console.log("Connected!");
        });
        let sql = `INSERT INTO ${tbName} SET ?`;
        con.query(sql, entity, (error, results, fields) => {
            console.log(sql);
            if (error) {
                reject(error);
            }
            resolve(results.insertId);
        });
        con.end();
    })
}