# Guide des Concepts NestJS et React - Earthway

**Date:** 10 décembre 2025  
**Auteur:** Documentation développement Earthway  
**Contexte:** Explications détaillées des concepts fondamentaux utilisés dans le projet

---

## Table des Matières

1. [Redis et Bull](#1-redis-et-bull)
2. [React Context](#2-react-context)
3. [Prisma Studio](#3-prisma-studio)
4. [Strategies (JWT et Google OAuth)](#4-strategies-jwt-et-google-oauth)
5. [Injectable vs Export](#5-injectable-vs-export)
6. [Le mot-clé `this`](#6-le-mot-clé-this)
7. [Modules, Services et Controllers](#7-modules-services-et-controllers)
8. [Injection de Dépendances](#8-injection-de-dépendances)
9. [Configuration des Modules (ConfigModule et BullModule)](#9-configuration-des-modules)

---

## 1. Redis et Bull

### Qu'est-ce que Redis ?

**Redis** est une **base de données en mémoire** ultra-rapide qui stocke des données sous forme de clés-valeurs. Contrairement à une base de données classique (comme PostgreSQL ou SQLite), Redis garde tout en RAM, ce qui le rend extrêmement performant.

#### Cas d'usage dans Earthway :
- **Cache** : Stocker temporairement les articles de news récupérés via RSS
- **Files d'attente** : Gérer les jobs asynchrones avec Bull
- **Sessions** : Stocker les refresh tokens (optionnel)

### Qu'est-ce que Bull ?

**Bull** est une **librairie de gestion de files d'attente** (queue) pour Node.js qui utilise Redis comme moteur de stockage.

#### Pourquoi utiliser Bull ?

Imaginons que vous devez envoyer un email de bienvenue à chaque nouvel utilisateur. Si vous faites ça de manière **synchrone** (dans le endpoint de registration), l'utilisateur doit attendre que l'email soit envoyé avant de recevoir la réponse du serveur.

Avec **Bull**, vous pouvez :
1. Ajouter une "tâche" (job) dans la file d'attente : *"Envoie un email à jean.dupont@example.com"*
2. Répondre immédiatement à l'utilisateur : *"Inscription réussie !"*
3. Bull traite la tâche en arrière-plan

#### Cas d'usage dans Earthway :

**Tâches asynchrones :**
- Envoi d'emails (bienvenue, vérification, confirmation donation)
- Génération de PDF de reçu fiscal
- Récupération quotidienne des articles RSS (via un cron job)

**Tâches planifiées (cron) :**
- Tous les jours à 6h du matin, récupérer les nouveaux articles de news
- Tous les mois, calculer l'impact total des utilisateurs

### Comment ça marche ensemble ?

```typescript
// Configuration dans app.module.ts
BullModule.forRoot({
  redis: {
    host: 'localhost',  // Adresse du serveur Redis
    port: 6379,         // Port par défaut de Redis
  },
})
```

**Flow complet :**

1. **Redis démarre** sur votre machine (port 6379)
2. **Bull se connecte à Redis** via la config ci-dessus
3. Dans votre code, vous créez une **queue** (file d'attente) :
   ```typescript
   @InjectQueue('mail') private mailQueue: Queue
   ```
4. Vous ajoutez un **job** dans la queue :
   ```typescript
   await this.mailQueue.add('sendWelcome', {
     email: 'user@example.com',
     name: 'Jean'
   });
   ```
5. Un **processor** (dans `mail.processor.ts`) écoute la queue et traite les jobs :
   ```typescript
   @Process('sendWelcome')
   async handleWelcome(job: Job) {
     // Envoie réel de l'email ici
     await this.mailService.sendWelcomeEmail(job.data.email, job.data.name);
   }
   ```

**Avantages :**
- ✅ Pas de blocage de l'API (réponse rapide à l'utilisateur)
- ✅ Retry automatique en cas d'échec (réseau instable, serveur SMTP down)
- ✅ Exécution en parallèle (plusieurs emails en même temps)
- ✅ Planification de tâches récurrentes (cron jobs)

---

## 2. React Context

### Le Problème : Props Drilling

Imaginons une app React avec cette structure :

```
App
└── Dashboard
    └── Header
        └── UserMenu
            └── UserAvatar  ← A besoin du `user`
```

Sans Context, vous devez **passer `user` en props à travers 5 composants** :

```typescript
<App user={user}>
  <Dashboard user={user}>
    <Header user={user}>
      <UserMenu user={user}>
        <UserAvatar user={user} />
      </UserMenu>
    </Header>
  </Dashboard>
</App>
```

C'est fastidieux et difficile à maintenir. C'est ce qu'on appelle le **props drilling**.

### La Solution : React Context

Le **Context** permet de créer une **"bulle d'état global"** accessible partout dans l'arbre de composants sans passer par les props.

#### Étapes dans Earthway :

**1. Créer le Context (`AuthContext.tsx`) :**

```typescript
// Création du contexte vide
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider qui encapsule l'état et les méthodes
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    setUser(response.data.user);
    setAccessToken(response.data.accessToken);
    // ...
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, accessToken, ... }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**2. Envelopper l'app dans le Provider (`App.tsx`) :**

```typescript
function App() {
  return (
    <AuthProvider>  {/* Tous les enfants ont accès au contexte */}
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

**3. Utiliser le Context dans n'importe quel composant :**

```typescript
// Dans le composant Profile.tsx (n'importe où dans l'arbre)
function Profile() {
  const { user, logout } = useAuth();  // Hook custom pour accéder au contexte

  return (
    <div>
      <h1>Bonjour {user?.firstName} !</h1>
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
}
```

### Avantages du Context

- ✅ **Pas de props drilling** : L'état `user` est accessible partout
- ✅ **Centralisé** : Toute la logique auth est dans `AuthContext.tsx`
- ✅ **Réutilisable** : `useAuth()` peut être appelé dans n'importe quel composant
- ✅ **Performant** : Seuls les composants qui utilisent le contexte se re-render

### Quand utiliser Context ?

- **État global** : User connecté, thème (dark/light), langue
- **Données partagées** : Panier e-commerce, notifications
- **Éviter props drilling** : Quand un état doit traverser 3+ composants

### Quand ne PAS utiliser Context ?

- **État local simple** : Un compteur dans un seul composant → `useState` suffit
- **Performances critiques** : Pour des données qui changent très souvent, préférer des state managers comme Zustand ou Redux

---

## 3. Prisma Studio

### Qu'est-ce que Prisma Studio ?

**Prisma Studio** est une **interface graphique (GUI)** qui permet de visualiser et modifier les données de votre base de données directement dans le navigateur.

C'est comme **phpMyAdmin** pour MySQL, mais en beaucoup plus moderne et intégré à Prisma.

### Comment le lancer ?

```bash
npx prisma studio
```

Cela ouvre automatiquement votre navigateur sur **http://localhost:5555**.

### Fonctionnalités principales

#### 1. **Visualiser les données**

Vous voyez toutes vos tables (modèles Prisma) :
- User
- Subscription
- Donation
- NewsArticle
- Impact
- etc.

Vous pouvez cliquer sur une table pour voir toutes les entrées (rows) avec leurs colonnes.

#### 2. **Éditer les données**

Vous pouvez :
- **Ajouter** une nouvelle entrée (cliquer sur "Add record")
- **Modifier** une entrée existante (double-clic sur une cellule)
- **Supprimer** une entrée (icône poubelle)

#### 3. **Filtrer et trier**

- **Filtrer** : `email contains "example"`
- **Trier** : Par ordre alphabétique, par date de création, etc.

#### 4. **Voir les relations**

Si vous cliquez sur un `User`, vous pouvez voir ses `Subscription[]`, ses `Donation[]`, etc.

### Cas d'usage dans Earthway

**Développement local :**
- Vérifier que le **seed** a bien inséré les données (`jean.dupont@example.com`, `marie.martin@example.com`)
- Tester manuellement l'inscription d'un user (voir si le hash bcrypt est correct)
- Modifier le statut d'une donation : `pending` → `completed`
- Ajouter un article de news manuellement pour tester le frontend

**Debugging :**
- Vérifier qu'un webhook Stripe a bien créé une `Subscription`
- Voir l'historique des `WebhookLog` en cas d'erreur
- Vérifier les `EmailPreference` d'un user

### Attention : Pas pour la production !

⚠️ **Prisma Studio est uniquement pour le développement local.** Ne jamais l'exposer en production (sécurité).

En production, utilisez :
- **PostgreSQL GUI** : pgAdmin, DBeaver, TablePlus
- **Scripts admin** : Des endpoints sécurisés avec rôle `ADMIN`

---

## 4. Strategies (JWT et Google OAuth)

### Qu'est-ce qu'une Strategy ?

Dans **NestJS** (avec Passport.js), une **Strategy** est une **classe qui définit comment authentifier un utilisateur**.

Il existe plusieurs types d'authentification :
- **JWT** : Vérifier qu'un token est valide
- **Google OAuth** : Se connecter via Google
- **Facebook OAuth** : Se connecter via Facebook
- **Local** : Email + mot de passe classique

Chaque méthode a sa propre **Strategy**.

---

### Strategy 1 : JWT Strategy (`jwt.strategy.ts`)

#### Rôle

Vérifier qu'un **token JWT** est valide quand un utilisateur fait une requête sur une route protégée.

#### Comment ça marche ?

**1. L'utilisateur envoie une requête avec son token :**

```http
GET /users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**2. NestJS extrait le token du header `Authorization` :**

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),  // ← Extrait le token
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),       // ← Clé secrète pour vérifier
    });
  }
```

**3. NestJS vérifie la signature du token :**

Si le token est valide (signature correcte, pas expiré), Passport appelle la méthode `validate()` :

```typescript
  async validate(payload: JwtPayload) {
    // payload = { sub: 1, email: 'jean.dupont@example.com' }
    return { userId: payload.sub, email: payload.email };
  }
}
```

**4. Le résultat est attaché à `req.user` :**

Dans votre controller :

```typescript
@UseGuards(JwtAuthGuard)
@Get('me')
async getMe(@Request() req) {
  console.log(req.user);  // { userId: 1, email: 'jean.dupont@example.com' }
  return this.usersService.findOne(req.user.userId);
}
```

#### Résumé du flow

```
Client envoie token
    ↓
JwtAuthGuard active JwtStrategy
    ↓
JwtStrategy extrait et vérifie le token
    ↓
Si valide → validate() retourne { userId, email }
    ↓
NestJS attache à req.user
    ↓
Controller reçoit req.user
```

---

### Strategy 2 : Google Strategy (`google.strategy.ts`)

#### Rôle

Gérer le **flow OAuth 2.0 avec Google** pour permettre aux utilisateurs de se connecter avec leur compte Google.

#### Comment ça marche ?

**1. L'utilisateur clique sur "Se connecter avec Google" :**

```typescript
// Frontend
<a href="http://localhost:3000/api/auth/google">
  <button>Se connecter avec Google</button>
</a>
```

**2. Le backend redirige vers Google :**

```typescript
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),           // ID de votre app Google
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),   // Secret
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),     // URL de retour
      scope: ['email', 'profile'],                               // Demander email + profil
    });
  }
```

**3. L'utilisateur se connecte sur Google :**

Google demande : *"Earthway veut accéder à votre email et profil. Autoriser ?"*

**4. Google redirige vers votre `callbackURL` avec un code :**

```
http://localhost:3000/api/auth/google/callback?code=4/0AY0e-g7...
```

**5. Passport échange le code contre un access token et appelle `validate()` :**

```typescript
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos, id } = profile;

    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      photoUrl: photos[0].value,
      oauthProvider: 'google',
      oauthId: id,
    };

    done(null, user);  // ← Retourne les infos user
  }
}
```

**6. NestJS attache les infos à `req.user` :**

Dans votre `AuthController` :

```typescript
@Get('google/callback')
@UseGuards(GoogleAuthGuard)
async googleCallback(@Request() req) {
  // req.user = { email: 'jean@gmail.com', firstName: 'Jean', ... }
  
  // Créer ou récupérer le user dans la DB
  const user = await this.authService.validateGoogleUser(req.user);
  
  // Générer un JWT
  const tokens = await this.authService.generateTokens(user);
  
  // Rediriger vers le frontend avec le token
  return res.redirect(`http://localhost:5173/auth/callback?token=${tokens.accessToken}`);
}
```

#### Résumé du flow

```
User clique "Google"
    ↓
Backend redirige vers Google
    ↓
User autorise sur Google
    ↓
Google redirige vers /auth/google/callback?code=...
    ↓
GoogleStrategy échange le code contre les infos user
    ↓
validate() retourne { email, firstName, ... }
    ↓
AuthController crée/récupère le user en DB
    ↓
Génère JWT et redirige vers frontend
```

---

### Différence entre JWT et Google Strategy

| Aspect | JWT Strategy | Google Strategy |
|--------|--------------|-----------------|
| **Quand** | À chaque requête protégée | Une seule fois (login initial) |
| **Input** | Token JWT dans header | Code OAuth de Google |
| **Output** | `{ userId, email }` | `{ email, firstName, lastName, photoUrl, oauthProvider, oauthId }` |
| **Usage** | Vérifier l'identité sur routes protégées | Créer un compte / Se connecter via Google |

---

## 5. Injectable vs Export

### @Injectable()

`@Injectable()` est un **décorateur NestJS** qui indique qu'une classe peut être **injectée** dans d'autres classes via le système de **Dependency Injection** (DI).

#### Exemple

```typescript
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaClient) {}

  async findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

**Ce que ça signifie :**
- NestJS peut **créer automatiquement une instance** de `UsersService`
- Cette instance peut être **injectée** dans d'autres classes (controllers, services)
- NestJS gère le **cycle de vie** (singleton par défaut)

#### Utilisation

Dans un controller :

```typescript
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}  // ← Injection automatique
  
  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }
}
```

NestJS voit `UsersService` dans le constructor et l'injecte automatiquement.

---

### export

`export` est un **mot-clé TypeScript** (JavaScript ES6) qui permet de **rendre une classe/fonction/variable importable** dans d'autres fichiers.

#### Exemple

```typescript
// users.service.ts
export class UsersService {  // ← Export TypeScript
  // ...
}
```

```typescript
// users.controller.ts
import { UsersService } from './users.service';  // ← Import TypeScript
```

**Ce que ça signifie :**
- TypeScript permet d'**importer** cette classe dans d'autres fichiers
- C'est juste du **module system** JavaScript/TypeScript
- **Aucun lien avec NestJS ou l'injection de dépendances**

---

### Différence clé

| Aspect | @Injectable() | export |
|--------|---------------|--------|
| **Type** | Décorateur NestJS | Mot-clé TypeScript |
| **Rôle** | Indique que NestJS peut injecter cette classe | Permet d'importer cette classe dans un autre fichier |
| **Nécessaire pour** | Dependency Injection | Import/Export de modules |
| **Peut être utilisé seul** | Non, nécessite aussi `export` | Oui, mais pas injectable |

#### Exemple sans @Injectable()

```typescript
export class MathHelper {  // ← Pas d'@Injectable()
  add(a: number, b: number) {
    return a + b;
  }
}
```

Vous pouvez l'importer et l'utiliser manuellement :

```typescript
import { MathHelper } from './math.helper';

const math = new MathHelper();  // ← Création manuelle
math.add(2, 3);
```

Mais vous **ne pouvez pas** l'injecter via le constructor.

#### Exemple avec @Injectable()

```typescript
@Injectable()
export class UsersService {
  // ...
}
```

Vous pouvez l'injecter automatiquement :

```typescript
constructor(private usersService: UsersService) {}  // ← NestJS crée l'instance
```

---

### En résumé

- **`export`** : "Cette classe peut être importée ailleurs" (TypeScript)
- **`@Injectable()`** : "NestJS peut créer et injecter cette classe automatiquement" (NestJS)

**Dans la plupart des services NestJS, vous utilisez les deux :**

```typescript
@Injectable()
export class MyService {
  // export → Importable
  // @Injectable() → Injectable
}
```

---

## 6. Le mot-clé `this`

### Qu'est-ce que `this` ?

En JavaScript/TypeScript, **`this`** fait référence à **l'objet courant** dans lequel le code s'exécute.

Dans le contexte des classes, **`this`** représente **l'instance de la classe**.

### Exemple simple

```typescript
class Person {
  firstName: string;
  lastName: string;

  constructor(firstName: string, lastName: string) {
    this.firstName = firstName;  // ← this = l'instance créée
    this.lastName = lastName;
  }

  getFullName() {
    return `${this.firstName} ${this.lastName}`;  // ← this = l'instance qui appelle la méthode
  }
}

const person = new Person('Jean', 'Dupont');
console.log(person.getFullName());  // "Jean Dupont"
```

**Explication :**
- `this.firstName` = la propriété `firstName` de l'instance `person`
- `this.lastName` = la propriété `lastName` de l'instance `person`

### Dans NestJS

```typescript
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}  // ← this.prisma est créé automatiquement

  async findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });  // ← this.prisma
  }

  async findAll() {
    return this.prisma.user.findMany();  // ← this.prisma
  }
}
```

**Explication :**
- `this.prisma` = la propriété `prisma` de l'instance de `UsersService`
- NestJS crée **une seule instance** de `UsersService` (singleton)
- Tous les appels à `findOne()` ou `findAll()` utilisent la **même instance** de `PrismaService`

### Pourquoi utiliser `this` ?

#### 1. Accéder aux propriétés de l'instance

```typescript
class Counter {
  count = 0;  // ← Propriété d'instance

  increment() {
    this.count++;  // ← On accède à la propriété via this
  }

  getCount() {
    return this.count;  // ← Idem
  }
}
```

#### 2. Appeler d'autres méthodes de l'instance

```typescript
class Calculator {
  add(a: number, b: number) {
    return a + b;
  }

  addAndDouble(a: number, b: number) {
    const sum = this.add(a, b);  // ← Appel de la méthode add() via this
    return sum * 2;
  }
}
```

#### 3. Injection de dépendances (NestJS)

```typescript
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,  // ← Injecté par NestJS
    private jwtService: JwtService,      // ← Injecté par NestJS
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);  // ← this.usersService
    if (!user) throw new UnauthorizedException();

    const token = this.jwtService.sign({ sub: user.id });  // ← this.jwtService
    return { accessToken: token };
  }
}
```

**Explication :**
- `this.usersService` = l'instance de `UsersService` injectée par NestJS
- `this.jwtService` = l'instance de `JwtService` injectée par NestJS

### Contexte et pièges de `this`

⚠️ **Attention** : `this` peut changer de valeur selon le contexte d'appel.

#### Exemple problématique

```typescript
class MyClass {
  value = 42;

  getValue() {
    return this.value;
  }
}

const obj = new MyClass();
console.log(obj.getValue());  // 42 ✅

const func = obj.getValue;
console.log(func());  // undefined ❌ (this n'est plus obj)
```

#### Solution : Arrow functions

```typescript
class MyClass {
  value = 42;

  getValue = () => {  // ← Arrow function
    return this.value;
  };
}

const obj = new MyClass();
const func = obj.getValue;
console.log(func());  // 42 ✅ (this est toujours obj)
```

**Dans NestJS, pas de souci** car les méthodes sont appelées dans le bon contexte (via l'instance du service).

---

## 7. Modules, Services et Controllers

NestJS est structuré en **modules**, qui contiennent des **services** (logique métier) et des **controllers** (routes HTTP).

### Analogie : Une usine

Imaginons une **usine de fabrication de voitures** :

- **Module** = L'usine entière (bâtiment, équipements, employés)
- **Service** = Les ouvriers qui fabriquent les pièces (moteur, roues, carrosserie)
- **Controller** = Le bureau de commande qui reçoit les demandes des clients et coordonne les ouvriers

---

### 1. Module

Un **module** est un **conteneur** qui regroupe des fonctionnalités liées.

#### Structure d'un module

```typescript
@Module({
  imports: [OtherModule],      // ← Autres modules nécessaires
  controllers: [UsersController],  // ← Controllers de ce module
  providers: [UsersService],   // ← Services de ce module
  exports: [UsersService],     // ← Services exportés (disponibles pour d'autres modules)
})
export class UsersModule {}
```

#### Rôle

- **Encapsuler** la logique liée aux utilisateurs
- **Déclarer** quels controllers et services appartiennent à ce module
- **Importer** d'autres modules nécessaires (AuthModule, PrismaModule, etc.)
- **Exporter** des services pour d'autres modules

#### Exemple dans Earthway

```typescript
@Module({
  imports: [PrismaModule],          // ← On a besoin de Prisma
  controllers: [UsersController],   // ← Route /users
  providers: [UsersService],        // ← Logique métier
  exports: [UsersService],          // ← D'autres modules peuvent utiliser UsersService
})
export class UsersModule {}
```

---

### 2. Service (Provider)

Un **service** contient la **logique métier** (business logic).

#### Exemples de responsabilités

- Interagir avec la base de données (via Prisma)
- Valider des données
- Envoyer des emails
- Calculer des statistiques
- Communiquer avec des APIs externes

#### Caractéristiques

- Décorateur **`@Injectable()`**
- Ajouté dans **`providers`** du module
- **Réutilisable** (peut être injecté dans plusieurs controllers ou services)

#### Exemple

```typescript
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: { ...data, password: hashedPassword },
    });
  }

  async update(id: number, data: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
```

**Responsabilités :**
- CRUD (Create, Read, Update, Delete) des utilisateurs
- Hash du mot de passe
- Validation métier (email unique, etc.)

---

### 3. Controller

Un **controller** gère les **routes HTTP** (endpoints API).

#### Exemples de responsabilités

- Recevoir les requêtes HTTP (GET, POST, PUT, DELETE)
- Valider les paramètres/body (via DTOs)
- Appeler les services pour exécuter la logique
- Retourner les réponses HTTP

#### Caractéristiques

- Décorateur **`@Controller('route')`**
- Ajouté dans **`controllers`** du module
- Utilise les décorateurs de routes : `@Get()`, `@Post()`, `@Put()`, `@Delete()`, etc.

#### Exemple

```typescript
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}  // ← Injection du service

  @Get()  // GET /users
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')  // GET /users/123
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Post()  // POST /users
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')  // PATCH /users/123
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')  // DELETE /users/123
  async delete(@Param('id') id: string) {
    return this.usersService.delete(+id);
  }
}
```

**Responsabilités :**
- Définir les routes (`/users`, `/users/:id`)
- Extraire les paramètres (`@Param`, `@Body`, `@Query`)
- Déléguer la logique au `UsersService`

---

### Séparation des responsabilités

| Couche | Responsabilité | Exemple |
|--------|----------------|---------|
| **Controller** | Recevoir HTTP, valider input, retourner réponse | `@Get('/users')` → `return usersService.findAll()` |
| **Service** | Logique métier, accès DB, calculs | `findAll()` → `prisma.user.findMany()` |
| **Prisma** | Communication base de données | `findMany()` → SQL query |

**Flow complet :**

```
Client HTTP
    ↓
GET /users
    ↓
UsersController.findAll()
    ↓
usersService.findAll()
    ↓
prisma.user.findMany()
    ↓
Database (SQLite/PostgreSQL)
    ↓
Réponse JSON
```

### Pourquoi cette séparation ?

✅ **Testabilité** : On peut tester le service sans HTTP (unit tests)  
✅ **Réutilisabilité** : Un service peut être utilisé par plusieurs controllers  
✅ **Maintenabilité** : Logique métier séparée du transport HTTP  
✅ **Évolutivité** : Facile d'ajouter GraphQL, WebSockets, etc. en réutilisant les services

---

## 8. Injection de Dépendances

### Le Problème (sans injection)

Imaginons que `UsersService` a besoin de `PrismaService` pour accéder à la base de données.

**Sans injection, vous devez créer manuellement les instances :**

```typescript
class UsersService {
  private prisma: PrismaService;

  constructor() {
    this.prisma = new PrismaService();  // ← Création manuelle
  }

  async findAll() {
    return this.prisma.user.findMany();
  }
}

const usersService = new UsersService();  // ← On doit créer nous-même l'instance
```

**Problèmes :**
- ❌ **Couplage fort** : `UsersService` dépend de l'implémentation de `PrismaService`
- ❌ **Difficile à tester** : Comment remplacer `PrismaService` par un mock ?
- ❌ **Duplication** : Si `AuthService` utilise aussi `PrismaService`, il faut créer une autre instance
- ❌ **Cycle de vie** : Qui gère la création et destruction des instances ?

---

### La Solution : Injection de Dépendances (DI)

L'**injection de dépendances** est un pattern où un **framework** (ici NestJS) **crée et fournit automatiquement** les dépendances dont une classe a besoin.

#### Analogie : Voiture et moteur

**Sans DI (manuel) :**

```typescript
class Car {
  private engine: Engine;

  constructor() {
    this.engine = new Engine();  // ← La voiture crée son propre moteur
  }
}
```

Problème : Si vous voulez changer de moteur (V6 → électrique), vous devez modifier la classe `Car`.

**Avec DI (automatique) :**

```typescript
class Car {
  constructor(private engine: Engine) {}  // ← On reçoit le moteur de l'extérieur
}

// NestJS crée et injecte le moteur
const engine = new Engine();
const car = new Car(engine);
```

Avantage : Vous pouvez fournir n'importe quel moteur sans modifier `Car`.

---

### Comment ça marche dans NestJS ?

#### 1. Déclarer les dépendances dans le constructor

```typescript
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,  // ← Dépendance déclarée
    private mailService: MailService,  // ← Autre dépendance
  ) {}

  async create(data: CreateUserDto) {
    const user = await this.prisma.user.create({ data });
    await this.mailService.sendWelcomeEmail(user.email);  // ← Utilisation
    return user;
  }
}
```

#### 2. NestJS résout automatiquement les dépendances

Quand NestJS crée une instance de `UsersService`, il :

1. Voit que `UsersService` a besoin de `PrismaService` et `MailService`
2. Cherche dans son **conteneur d'injection** (Dependency Injection Container)
3. Crée ou récupère les instances de `PrismaService` et `MailService`
4. Les passe au constructor de `UsersService`

**Vous n'avez rien à faire manuellement !**

#### 3. Déclarer les providers dans le module

```typescript
@Module({
  imports: [PrismaModule, MailModule],  // ← Modules qui fournissent PrismaService et MailService
  providers: [UsersService],            // ← UsersService est un provider
  controllers: [UsersController],
  exports: [UsersService],              // ← Exporté pour d'autres modules
})
export class UsersModule {}
```

---

### Avantages de l'Injection de Dépendances

#### 1. **Testabilité**

Vous pouvez facilement **remplacer** une dépendance par un **mock** pour les tests.

```typescript
// users.service.spec.ts
const mockPrismaService = {
  user: {
    findMany: jest.fn().mockResolvedValue([{ id: 1, email: 'test@example.com' }]),
  },
};

const module = await Test.createTestingModule({
  providers: [
    UsersService,
    { provide: PrismaService, useValue: mockPrismaService },  // ← Mock
  ],
}).compile();

const usersService = module.get<UsersService>(UsersService);
```

#### 2. **Réutilisabilité**

`PrismaService` est créé **une seule fois** (singleton) et partagé entre tous les services.

```typescript
UsersService → PrismaService (même instance)
AuthService → PrismaService (même instance)
DonationsService → PrismaService (même instance)
```

#### 3. **Découplage**

`UsersService` ne sait pas **comment** créer `PrismaService`, il sait juste qu'il en a besoin.

#### 4. **Maintenance**

Si vous changez l'implémentation de `PrismaService`, vous n'avez pas à modifier tous les services qui l'utilisent.

---

### Types de providers

#### 1. **Value Provider** (valeur statique)

```typescript
{
  provide: 'API_KEY',
  useValue: 'my-secret-key-123',
}
```

Utilisation :

```typescript
constructor(@Inject('API_KEY') private apiKey: string) {}
```

#### 2. **Factory Provider** (fonction de création)

```typescript
{
  provide: 'DATABASE_CONNECTION',
  useFactory: async () => {
    const connection = await createDatabaseConnection();
    return connection;
  },
}
```

#### 3. **Class Provider** (classe alternative)

```typescript
{
  provide: MailService,
  useClass: MockMailService,  // ← Remplace MailService par MockMailService
}
```

---

### Flow complet dans Earthway

**Exemple : Inscription d'un utilisateur**

```
Client POST /auth/register
    ↓
AuthController.register()
    ↓
authService.register()  ← NestJS injecte AuthService
    ↓
usersService.create()  ← AuthService utilise UsersService (injecté)
    ↓
prisma.user.create()  ← UsersService utilise PrismaService (injecté)
    ↓
mailQueue.add('sendWelcome')  ← AuthService utilise @InjectQueue (injecté)
    ↓
Réponse { user, accessToken }
```

**Toutes les dépendances sont injectées automatiquement !**

---

## 9. Configuration des Modules

### Pourquoi importer des modules ?

Dans `app.module.ts`, vous **importez** des modules pour les rendre disponibles dans votre application.

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({ redis: { host: 'localhost', port: 6379 } }),
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

### 1. ConfigModule.forRoot({ isGlobal: true })

#### Rôle

Charger les **variables d'environnement** depuis le fichier `.env` et les rendre accessibles partout via `ConfigService`.

#### Sans ConfigModule

Vous devriez utiliser `process.env` partout :

```typescript
const jwtSecret = process.env.JWT_ACCESS_SECRET;  // ❌ Pas typé, peut être undefined
```

#### Avec ConfigModule

```typescript
@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}

  getSecret() {
    return this.configService.get('JWT_ACCESS_SECRET');  // ✅ Typé, validé
  }
}
```

#### Option `isGlobal: true`

**Sans `isGlobal` :**

Vous devez **réimporter** `ConfigModule` dans chaque module qui en a besoin :

```typescript
@Module({
  imports: [ConfigModule],  // ← Répété partout
  providers: [AuthService],
})
export class AuthModule {}

@Module({
  imports: [ConfigModule],  // ← Répété partout
  providers: [UsersService],
})
export class UsersModule {}
```

**Avec `isGlobal: true` :**

Vous importez `ConfigModule` **une seule fois** dans `AppModule`, et tous les modules peuvent utiliser `ConfigService` :

```typescript
// app.module.ts
ConfigModule.forRoot({ isGlobal: true }),  // ← Une seule fois

// auth.module.ts (pas besoin d'importer ConfigModule)
@Module({
  providers: [AuthService],  // ← Peut utiliser ConfigService directement
})
export class AuthModule {}
```

#### Avantages

✅ **Pas de répétition** : Import unique dans `AppModule`  
✅ **Centralisé** : Toutes les variables `.env` au même endroit  
✅ **Validation** : Vous pouvez valider les variables au démarrage (Joi, Zod)

---

### 2. BullModule.forRoot({ redis: { ... } })

#### Rôle

Configurer la **connexion Redis** pour toutes les queues Bull de l'application.

#### Configuration

```typescript
BullModule.forRoot({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
})
```

**Ce que ça fait :**
- Établit une connexion à Redis (localhost:6379)
- Toutes les queues Bull créées avec `BullModule.registerQueue()` utilisent cette connexion

#### Utilisation dans un module

```typescript
// mail.module.ts
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mail',  // ← Nom de la queue
    }),
  ],
  providers: [MailService, MailProcessor],
})
export class MailModule {}
```

#### Injection de la queue

```typescript
@Injectable()
export class MailService {
  constructor(@InjectQueue('mail') private mailQueue: Queue) {}

  async sendWelcomeEmail(email: string, name: string) {
    await this.mailQueue.add('sendWelcome', { email, name });
  }
}
```

#### Flow complet

```
AppModule → BullModule.forRoot (connexion Redis)
    ↓
MailModule → BullModule.registerQueue('mail')
    ↓
MailService → @InjectQueue('mail') (injecte la queue)
    ↓
mailQueue.add('sendWelcome', { ... })  (ajoute un job)
    ↓
MailProcessor → @Process('sendWelcome') (traite le job)
    ↓
Envoi réel de l'email
```

---

### 3. Différence entre forRoot() et register()

| Méthode | Rôle | Exemple |
|---------|------|---------|
| **forRoot()** | Configuration **globale** (une seule fois dans AppModule) | `ConfigModule.forRoot()`, `BullModule.forRoot()` |
| **register()** | Configuration **locale** (dans chaque module qui en a besoin) | `BullModule.registerQueue()`, `JwtModule.register()` |

#### Exemple : JwtModule

**forRoot() (global) :**

```typescript
// app.module.ts
JwtModule.forRoot({
  secret: 'my-secret',
  signOptions: { expiresIn: '15m' },
})
```

Tous les modules peuvent utiliser `JwtService` avec cette config.

**register() (local) :**

```typescript
// auth.module.ts
JwtModule.register({
  secret: 'my-secret',
  signOptions: { expiresIn: '15m' },
})
```

Seulement `AuthModule` peut utiliser `JwtService` avec cette config.

---

### 4. Ordre des imports

L'ordre des imports peut être important si un module dépend d'un autre.

#### Exemple

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),  // ← 1. Charger .env en premier
    BullModule.forRoot({                       // ← 2. Utilise les variables .env
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    }),
    MailModule,  // ← 3. Utilise BullModule
  ],
})
export class AppModule {}
```

**Ordre logique :**
1. `ConfigModule` charge `.env`
2. `BullModule` utilise `REDIS_HOST` et `REDIS_PORT`
3. `MailModule` utilise `BullModule` pour créer des queues

---

## Conclusion

### Récapitulatif des concepts

1. **Redis + Bull** : Jobs asynchrones (emails, cron RSS) avec file d'attente Redis
2. **React Context** : État global (user, auth) accessible partout sans props drilling
3. **Prisma Studio** : GUI pour explorer la DB en local (http://localhost:5555)
4. **Strategies** :
   - **JwtStrategy** : Valide token JWT sur routes protégées
   - **GoogleStrategy** : OAuth 2.0 flow (login avec Google)
5. **@Injectable() vs export** :
   - `@Injectable()` : NestJS peut injecter cette classe
   - `export` : TypeScript peut importer cette classe
6. **this** : Accès aux propriétés/méthodes de l'instance courante
7. **Modules/Services/Controllers** :
   - **Module** : Conteneur (encapsule services + controllers)
   - **Service** : Logique métier (providers)
   - **Controller** : Routes HTTP (controllers)
8. **Injection de dépendances** : NestJS fournit automatiquement les dépendances (constructor params)
9. **Configuration modules** :
   - `ConfigModule.forRoot({ isGlobal: true })` : Variables .env accessibles partout
   - `BullModule.forRoot({ redis })` : Connexion Redis pour jobs asynchrones

---

### Prochaines étapes

Maintenant que vous maîtrisez ces concepts, vous êtes prêt pour :

- **Phase 3** : Améliorer `home.tsx`, créer Layout/Footer/Nav (US1 Découverte)
- **Phase 4** : Implémenter le module News backend + frontend (US2 Information)
- **Phase 5** : Créer `AuthService` complet avec bcrypt, JWT, Google OAuth, emails (US3 Auth)

### Ressources supplémentaires

- **NestJS Documentation** : https://docs.nestjs.com
- **Prisma Documentation** : https://www.prisma.io/docs
- **Bull Documentation** : https://github.com/OptimalBits/bull
- **React Context** : https://react.dev/reference/react/useContext
- **Passport.js Strategies** : https://www.passportjs.org/packages/

---

**Document généré le 10 décembre 2025**  
**Projet Earthway - MVP en développement** dd. zzzz
