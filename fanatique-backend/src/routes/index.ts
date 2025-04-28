import { Router } from "express";

import wallet from './wallet.routes'
import user from './user.routes'
import club from './club.routes'
import userClub from './user-club.routes'
import stadium from './stadium.routes'
import match from './match.routes'
import establishment from './establishment.routes'
import product from './product.routes'
import establishmentStadium from './establishmentStadium.routes'
import order from './order.routes'
import quest from './quest.routes'
import questUser from './quest-user.routes'
import contract from './contract.routes'

const apiRouter = Router();

apiRouter.use("/wallet", wallet);
apiRouter.use("/user", user);
apiRouter.use("/club", club);
apiRouter.use("/user-club", userClub);
apiRouter.use("/stadium", stadium);
apiRouter.use("/match", match);
apiRouter.use("/establishment", establishment);
apiRouter.use("/product", product);
apiRouter.use("/establishment-stadium", establishmentStadium);
apiRouter.use("/order", order);
apiRouter.use("/quest", quest);
apiRouter.use("/quest-user", questUser);
apiRouter.use("/contract", contract);

export default apiRouter;