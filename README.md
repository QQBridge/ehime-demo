# チャットボット
PWCのチャットボットです。のちのち、社内版にもここの変更を反映させます。

## ローカルの立ち上げ方
1. ハリーに環境変数をもらって、送られた内容をそのまま`.env.local`に入れてください。
2. パソコンに(nvmなどではなく直接)nodejs 22のltsが入ってることを確認してください。なかったら構築方法をハリーに聞いてください。
3. `npm install`
4. `npm run dev`

## ローカルの立ち上げ方その２
1. `npm run dev`はどちらかというと色々変更している間に走らせて、コードを変える度に反映させるやり方です
2. `npm run build`したあとに`npm run start`すると、よりサイト自体の反応が速いもののリアルタイムでコードが反映されない状態で立ち上げられます
3. コードをある程度書いてからテストしたいときに便利です

## デプロイの仕方
`.env.local`を設定し、`npm install`を行ったあと、Supabaseの準備、OpenAIまたはAzure OpenAIの準備、Azure App Serviceの準備の3つのステップがあります。

### Supabaseの準備
1. https://supabase.com のアカウントを生成、またはログインします
2. https://supabase.com/dashboard/projects から「New project」を押します
3. データを入力します
  - Project name: なんでもいいです。
  - Database Password: 入力欄の下にある「Generate a password」をクリックしてください。特にパスワードを控える必要はありません。
  - Region: どこでもいいです。Northeast Asia (Tokyo)にしても良いですが、ほぼ変化はありません。
4. Create new projectを押します。他のページに飛ばされます。
5. 画面左下に「Project Settings」というボタンがあるので、これを押します。
6. 左の一覧の「CONFIGURATION」という文字の2つ下にある「API」を押してください。
  - Project URLの「URL」をコピーし、.env.localの`NEXT_PUBLIC_SUPABASE_URL`の内容を書き換えてください。
  - Project API keysの「anon public」をコピーし、.env.localの`NEXT_PUBLIC_SUPABASE_ANON_KEY`の内容を書き換えてください。
  - Project API keysの「service_role」を「reveal」ボタンを押した後にコピーし、.env.localの`SUPABASE_SERVICE_ROLE_KEY`の内容を書き換えてください。
7. 左の一覧の「Authentication」を押し、出てきた画面で少しスクロールし、SMTP Settingsの「Enable Custom SMTP」を有効化してください。ここの入力内容はAICE高橋、またはQQ飯田から受け取ってください。
8. 左の一覧の「General」を押し、General Settingsの「Reference ID」を控えてください。次のステップで使います。

### Supabaseの設定
1. `supabase/migrations/20240108234540_setup.sql`というファイルをこのように変更してください：
  - 53行目`project_url`は.env.localの`NEXT_PUBLIC_SUPABASE_URL`の内容に変更
  - 54行目`service_role_key`は.env.localの`SUPABASE_SERVICE_ROLE_KEY`の内容に変更
2. `npx supabase login`をしてください。
3. `npx supabase link --project-ref <Reference ID>`をしてください。
  - <Reference ID>は「Supabaseの準備」の最後で取得したReference IDに変えてください。<>は必要ないです。
4. `npx supabase db push`をしてください。

### Azure OpenAIの準備
gpt-4oのみ現在使用可能です。なお、gpt-4oモデルのデプロイ名は「gpt-4o」にしてください。
.env.localのこれらを設定してください：
- AZURE_OPENAI_API_KEY
- AZURE_OPENAI_ENDPOINT
- AZURE_EMBEDDINGS_NAME
なお、詳しい設定方法はAICE高橋またはQQ飯田に聞いてください。

### OpenAIの準備
.env.localの`OPENAI_API_KEY`を設定してください。
なお、詳しい設定方法はAICE高橋またはQQ飯田に聞いてください。

### Azure App Serviceの準備
1. App Servicesから、Create Web Appをしてください。
2. 設定はこのようにやってください：
  - Name: ドメインの名前になります。
  - Runtime Stack: Node 20 LTS
  - Region: Japan East
3. Createしてください。飛ばされたページで、少し待ってください。
4. Deployが完了という表示が出たら、新しいAzure App Serviceに移動してください。
5. SettingsのConfigurationのStartup Commandを`node .next/standalone/server.js`にしてください。

### デプロイ
1. Visual Studio Codeにて、Azureのエクステンションをインストールしてください。
2. Azureのタブができます。ここで、Azure Accountにサインインしてください。
3. 表示されたSubscriptionをクリックし、App Serviceの中で新しく作ったものを見つけてください。
4. これを右クリック、Deploy to Web Appしてください。
5. フォルダを選び、出てきた画面でOKを押してください。
6. 少し待ちます。5分程度かかります。デプロイ完了という表示が出ても、少し待ってください。
7. また新しいApp Serviceを右クリックし、ブラウズしてください。ここでサイトが表示されれば、デプロイ成功です。

### 初期設定・設定変更方法
1. レポジトリのブランチを`admin`に変更し、`npm run build`したのち、`npm run start`してください。
2. `localhost:3000`にブラウザでアクセスしてください。
3. 初期設定の場合は新しいアカウントを作ってください。今後、このアカウントがこのインスタンスを管理するための管理者アカウントになります。メールが届くので、メールに含まれるリンクをクリックしてください。
4. ログインして、飛ばされたページでリフレッシュし、出てきた設定画面をすべてスキップしてください。
5. 左に設定バーがあります。ない場合は、画面左側の小さな矢印を押してください。
6. 上から6番目の紙のロゴをクリックします。
7. 設定する「AI」のRAGに使うファイルをすべてこのようにアップロードしてください:
  - New Fileを押す
  - ファイルを選ぶ
  - Createする
  - 終わるまで待つ
8. 左の設定バーの上から8番目のニッコリした四角い顔のロゴをクリックします。
9. 設定する「AI」について、このように操作してください：
  - New Assistantを押す
  - Nameを記入
  - Imageを選ぶ（予め正方形にクロップした画像を使用してください）
  - Promptを書く
  - Files & Collectionsで、RAGに使用したいファイルをすべて選ぶ
    - このとき、ファイルは「このAIのチャットすべてについて使用するもの」を選んでください。
  - Createする
  - 待つ
10. 設定は完了です。

### アカウントの作り方
1. デプロイしたサイトにアクセスします。
2. 新しいアカウントに使用したいメールと、パスワードを入力します。
3. Sign upを押します。
4. ほどなくメールが届くので、このメールのリンクを押します。このとき、メールがスパムフォルダに行く場合があるので、ご注意ください。
5. 新しいアカウントにログインします。
6. 飛ばされたページでリフレッシュします。
7. 新しく表示されたページで、何も操作せずにOKを押し続けます。
8. アカウントが作成されました。以後、ログインしたらそのままチャットに飛びます。