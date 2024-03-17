import { faker, simpleFaker } from '@faker-js/faker'
import { User } from '../models/user.js';
import { Chat } from '../models/chat.js';


export const createUser = async (numUsers) => {
    try {
        const userPromise = [];

        for (let i = 0; i < numUsers; i++) {
            const tempUser = User.create({
                name: faker.person.fullName(),
                username: faker.internet.userName(),
                bio: faker.lorem.sentence(10),
                password: "password",
                avatar: {
                    url: faker.image.avatar(),
                    public_id: faker.system.fileName(),
                }

            })
            userPromise.push(tempUser)
        }
        await Promise.all(userPromise);

        console.log('Users Created', numUsers);
        process.exit(1);

    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}

export const createSingleChats = async (chatsCount) => {
    try {
        const users = await User.find().select("_id");

        const chatsPromise = [];

        for (let i = 0; i < users.length; i++) {
            for (let j = i + 1; j < users.length; j++) {
                chatsPromise.push(Chat.create({
                    name: faker.lorem.words(2),
                    members: [users[i], users[j]]
                }))
            }
        }

        await Promise.all(chatsPromise);
        console.log("Chats created Successfully");
        process.exit(1);

    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}

export const createGroupChats = async (numChats) => {
    try {

        const users = await User.find().select("_id");

        const chatsPromise = [];

        for (let i = 0; i < numChats.length; i++) {
            const numMembers = simpleFaker.number.int({ min: 3, max: users.length });
            const members = [];

            for (let i = 0; i < numMembers.length; i++) {
                const randomIndex = Math.floor(Math.random() * users.length);
                const randomUser = users[randomIndex];

                if (!members.includes(randomUser)) {
                    members.push(randomUser)
                }

            }
            const chat = Chat.create({
                groupChat: true,
                name: faker.lorem.words(2),
                members,
                creator: mem[0]
            });
            chatsPromise.push(chat);
        }
        await Promise.all(chatsPromise);
        console.log("Chats created Successfully");
        process.exit(1);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}