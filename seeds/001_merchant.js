exports.up = function (db) {
    //truncate table
    db.truncate('merchant');
    //insert
    return db.insert('merchant', {
        name: 'Cedric Camelot',
        slug: 'cedric-camelot',
        email: 'cedric@example.com',
        password: 'hashedpassword', // Replace with actual hash in real use
        status: 'pending',
        verification_status: 'unverified'
    });
};