const express = require('express');
const logged_user = require('./logged.json')
const credentials = require('./credentials.json')
const mongooseUser = require('mongoose');
const app = express();
const mysql = require('mysql2');

mongooseUser.connect(credentials.db.mongoDB.host, { useNewUrlParser: true, useUnifiedTopology: true });

const Users = mongooseUser.model('users', {
    name: String,
    password: Number,
    role: Number
});

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: "120312"
});
const database_name = "market"
const table_name = "products"

const create_database = `create database if not exists market;`;
const use_database = `use ${database_name};`;
const create_tables = `create table if not exists ${table_name}(
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(255) UNIQUE KEY NOT NULL,
        category VARCHAR(255) NOT NULL,
        stock INT,
        price DECIMAL(15,2) NOT NULL
  )`;

connection.query(create_database,
    (err, results, fields) => {

    }
);
connection.query(use_database,
    (err, results, fields) => {

    }
);
connection.query(create_tables,
    (err, results, fields) => {

    }
);

app.set('view engine', 'ejs');
app.set('views', __dirname, '/views');
app.use(express.urlencoded());
app.use(express.json());
app.use(express.static("public"));

//Home page
app.route('/add')
    .get((req, res) => {
        res.render('form_add_product');
    })
    .post((req, res) => {
        const {
            name, code, category, stock, price
        } = req.body
        let insert_data = `
        insert into products (name,code,category,stock,price) values ("${name}","${code}","${category}",${stock},${price});
        `
        console.log(insert_data)

        connection.query(insert_data,
            (err, results, fields) => {
                if (err) return err;
                return res.redirect('/products');
            }
        );
    });

app.route('/')
    .get((req, res) => {
        res.redirect('/products');
    });

app.route('/products')
    .get((req, res) => {
        let select_all = `select * from products`
        connection.query(select_all,
            (err, results, fields) => {
                if (err) return err;
                console.log(results)
                res.render('products', { items: results, user: require('./logged.json') });
            }
        );
    });

app.post('/delete/:id', (req, res) => {
    const { id } = req.params
    let delete_item = `DELETE FROM ${table_name} WHERE id = ${id};`
    connection.query(delete_item, (err, result, fields) => {
        if (err) return err
        console.log(result[0])
        res.redirect('/products');
    }
    );
});

app.post('/edit/:id', (req, res) => {
    let edit_data = ` select * from products where id = ${req.params.id} `
    connection.query(edit_data,
        (err, result, fields) => {
            if (err) return err
            console.log(result[0])
            res.render('form_edit_product', { item: result[0] });
        }
    );
})

app.post('/sell/:id', (req, res) => {
    const { id } = req.params
    let sell_product = ` UPDATE products SET stock = stock-1 WHERE id = ${id}; `
    connection.query(sell_product,
        (err, result, fields) => {
            if (err) return err
            console.log(result[0])
            res.redirect('/products');
        }
    );
})

app.post('/editProduct', (req, res) => {
    const {
        id, name, code, stock, price, category
    } = req.body
    let update_data = `UPDATE products SET name = "${name}" , code = ${code}, category = "${category}", stock = ${stock}, price =${price} WHERE id = ${id};`
    connection.query(update_data, (err, result, fields) => {
        if (err) return err
        res.redirect("/products")
    });
});

app.post('/login', (req, res) => {
    const {
        name, password
    } = req.body

    console.log(name)
    console.log(password)

    Users.find({ name: name, password: password }, (err, temp_user) => {
        console.log(temp_user)
        if (err)
            return res.status(500).send("Erro ao encontrar usuário, utilize credenciais válidas");
        const {
            name, role
        } = temp_user[0]

        logged_user.logged = name
        logged_user.role = role
        console.log(logged_user)
        return res.redirect('/products');

    });
});

app.post('/logout', (req, res) => {
    logged_user.logged = 0
    logged_user.role = 0
    return res.redirect('/products');

});



app.post('/search', (req, res) => {
    console.log(typeof req.body.search);
    const { search } = req.body
    let temp_search = `select * from products where name like "%${search}%";`
    console.log(temp_search);

    connection.query(temp_search,
        (err, results, fields) => {
            if (err) return err
            console.log(results);
            res.render('products_search', { items: results });
        }
    );
})

app.listen(8000, () => {
    console.log(`Server is running! (port 8000)`);
})