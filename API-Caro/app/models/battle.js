const db = require('../utils/db');
const table = 'battle';
const pKey = 'ID';
const fKey1 = 'WinnerID';
const fKey2 = 'LoserID';
const fTable = 'account';
let row = {
    ID: 0,
    WinnerID: 0,
    LoserID: 0,
    GUID: "",
    IsDraw: 0,
    CreatedAt: new Date(),
    Row: 20,
    Col: 30,
    SignOfWinner: "X"
};
module.exports = {
    sample: () => {
        return row;
    },
    login: async (username, password) => {
        const sql = `SELECT  *
                     FROM ${table} t       
                     WHERE t.Username= '${username}' and t.Password= '${password}'`;
        const rows = await db.load(sql);
        //console.log("token:", rows);
        return rows;
    },
    findByID: async (id) => {
        const sql = `SELECT  *
                     FROM ${table} t       
                     WHERE t.${pKey}= ${id}`;
        const rows = await db.load(sql);
        return rows;
    },
    findByUserID: async (uid) => {
        const sql = `SELECT  t.* ,u1.Username as "Winner", u2.Username as "Loser"
                     FROM ${table} t JOIN ${fTable} u1
                                      ON t.${fKey1}=u1.ID
                                      JOIN  ${fTable} u2
                                       ON t.${fKey2}=u2.ID  
                     WHERE t.${fKey1}= ${uid} OR t.${fKey2}=${uid}
                     ORDER BY t.ID DESC`;
        const rows = await db.load(sql);
        return rows;
    },
    where: async (condition) => {
        const sql = `SELECT  *
                     FROM ${table}        
                     WHERE ${condition}`;
        const rows = await db.load(sql);
        return rows;
    },
    getAll: async () => {
        const sql = `SELECT t.* ,u1.Username as "Winner", u2.Username as "Loser"
                     FROM  ${table} t JOIN ${fTable} u1
                                      ON t.${fKey1}=u1.ID
                                      JOIN  ${fTable} u2
                                       ON t.${fKey2}=u2.ID`;
        const rows = await db.load(sql);
        return rows;
    },
    insert: async (entity) => {
        var obj = Object.assign({}, row, entity);
        delete obj.ID;
        const id = await db.add(table, obj);
        return id;

    },
    update: async (entity) => {
        //const item = await this.findByID(entity.id);
        //var obj = Object.assign({}, item, entity);
        const rows = await db.update(table, pKey, entity);
        return rows;
    }
};
