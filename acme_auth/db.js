const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const { STRING } = Sequelize;
const config = {
  logging: false,
};
const jwt = require('jsonwebtoken');

const notes = [
  {
    text: 'This is a note',
    userId: 1,
  },
  {
    text: 'This is note#2',
    userId: 1,
  },
  {
    text: 'This is note#3',
    userId: 1,
  },
  {
    text: 'This is note#4',
    userId: 2,
  },
  {
    text: 'This is note#5',
    userId: 2,
  },
  {
    text: 'This is note#6',
    userId: 2,
  },
  {
    text: 'This is note#7',
    userId: 3,
  },
  {
    text: 'This is note#8',
    userId: 3,
  },
  {
    text: 'This is note#9',
    userId: 3,
  },
];
const tokenSecret = process.env.JWT;

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
);

const User = conn.define('user', {
  username: STRING,
  password: STRING,
});

const Note = conn.define('note', {
  text: Sequelize.STRING,
});
User.beforeCreate(async (user, options) => {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  user.password = hashedPassword;
});

User.byToken = async (token) => {
  try {
    const verified = jwt.verify(token, tokenSecret);
    if (verified) {
      const user = await User.findByPk(verified.id);
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
    },
  });
  if (await bcrypt.compare(password, user.password)) {
    const token = await jwt.sign(
      { id: user.id, username: user.username },
      tokenSecret
    );
    return token;
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw' },
    { username: 'moe', password: 'moe_pw' },
    { username: 'larry', password: 'larry_pw' },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  await Promise.all(notes.map((note) => Note.create(note)));
  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

User.hasMany(Note);
Note.belongsTo(User);

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
};
