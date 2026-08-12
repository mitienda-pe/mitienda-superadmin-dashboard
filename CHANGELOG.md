# Changelog

Generado con `scripts/changelog.sh` desde los conventional commits.
No editar a mano: los cambios se pierden en la siguiente regeneracion.

## Agosto 2026

### Novedades

- **billing:** emision en lote y envio por correo en Ventas de Planes ([`a5b1a0d`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/a5b1a0d2cbc110958ad3c207f6f1f8406742bcb6))
- **billing:** boton Emitir en Ventas de Planes ([`1c8efbd`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/1c8efbd22676d9b7efa129ed107751c986715e44))
- **stores:** indicar en el buscador que acepta ID de tienda ([`7af4075`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/7af40750ac9999a7a9318a049a8acc3bc1b4a5f1))
- **stores:** columna y filtro de migración de storefront ([`54ebc70`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/54ebc7039a1374ec62114c65385891a6a0cfa150))

### Correcciones

- **planes:** mostrar el plan PDV en la matriz y en precios del superadmin ([`d800fd7`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/d800fd78b7dcb6fbfc2ed0c2207fb0edc6b7b556))

## Julio 2026

### Novedades

- **store-sales:** filtros de plan, estado y tipo en ventas por tienda ([`c8def5d`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/c8def5d5c2f749c60f260c903deecae158a16b76))
- **store-sales:** módulo de ventas por tienda en rango de fechas ([`bdfe1d2`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/bdfe1d231290910d6248589fdb7962801e31d46f))
- **stores:** botón "Dar de baja" en ficha de tienda ([`c0c39c0`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/c0c39c061c39eb599acd603dc12a94edd774a4b6))
- **stores:** botón "Renovar plan" en ficha de tienda ([`d7f9a68`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/d7f9a68b7bfbf0c2a5cfbc766cff402fcb995ced))

## Junio 2026

### Novedades

- **stores:** panel de onboarding del titular en el detalle de tienda ([`fe8e52d`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/fe8e52d212cbe26af4100e5a99b327b72f15ad8d))
- **users:** mostrar columna Creado (fecha de creación) ([`659aa95`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/659aa9550c8ae36a885224809e06fdfe0c9bb13d))
- **users:** ordenar la tabla por columnas ([`5af536d`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/5af536d5abb38044a26d77649067f6bd6f65902a))
- **users:** filtro por rol + default a tiendas vigentes ([`113a6f9`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/113a6f976469d0f192834f64be42b3902165fba3))
- **users:** filtro y columna de estado de la tienda (vigente/vencido) ([`a45af53`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/a45af5379688caa0031314758e582e4b85a54150))
- **users:** vista de Usuarios (administradores) con estado + reenviar ([`283f4b9`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/283f4b9a9c7a30f6140d82b664319bf9a772c6bc))
- **stores:** mensaje al adjuntar tienda a cuenta existente ([`c85be6b`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/c85be6b79cf363d9ffa1b814546df9d806a2a5d3))
- **stores:** toggle "Incluir PDV" para planes e-commerce ([`4a935ef`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/4a935ef74ce7fd60abe520c3cd6d9b4648589fc5))
- **stores:** enviar solo el ubigeo (backend puebla los nombres) ([`010a751`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/010a7510361d08d71ffcf83b61d6b1558778fce3))
- **stores:** selector de ubigeo opcional al crear tienda ([`bfe82cc`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/bfe82ccb95219729f116c03070f0fc2bab4a9d06))
- **stores:** formulario para crear tiendas (tenants) desde el dashboard ([`077e001`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/077e0012769937240acaa3d932ef8d49c143f557))

### Correcciones

- **ui:** restaurar layout de p-input-icon-left en los buscadores ([`99525ad`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/99525ad52ac483f3cbca06ef1bb41244c76ef6e9))

## Mayo 2026

### Novedades

- **stores:** exponer mod_cupones y mod_promociones_v2 en panel de modulos ([`1f8d987`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/1f8d987926cdebac6015f5869de2f4279b350e81))
- **stores:** edit name, change plan, max_users, flag=all filter ([`0a7f929`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/0a7f929d282adeaff295e5a9fe29da6358a7d79f))
- **pdv:** toggle "POS habilitado como complemento" en StoreConfigPanel ([`f1de5c4`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/f1de5c40017bec802125c19a00c97e8fd5ef4cc1))
- **broadcasts:** segmentar broadcasts globales por plan y vigencia ([`67a0287`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/67a0287cee3607cbc060d5ca76c4c366a55a708a))

### Correcciones

- **ci:** usar nombre de secret CLOUDFLARE_API_TOKEN ([`2f782f0`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/2f782f0d01de2a0bfd394f9dc5e33e23ea263a6f))

## Abril 2026

### Novedades

- **plugins:** superadmin management view for plugin framework ([`367764c`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/367764c6c8d58e83957d2df4f2dc2edb8acc6bc1))
- **complaints:** platform libro de reclamaciones panel ([`c08bbbd`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/c08bbbd51dc68edf47ac7ddc3002838d5ffa708c))
- **broadcasts:** reset dismissals action with usage count ([`048d656`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/048d6564aecc90ae88f974b54285b72a6c0f546d))
- **broadcasts:** support Markdown in message body ([`061cdea`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/061cdea6acc55c0aa7b8aa043944e9b850d409cc))
- add broadcasts CRUD view for superadmin ([`0e1e615`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/0e1e615566889447268ea2b64f99ef7a5cc1fbd1))
- add Umami Website ID field to store config panel ([`5714330`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/5714330e2fa3e0f33a979c77c1e5100ed88c0a9d))

### Correcciones

- **plugins:** dialog spacing and sidebar icon ([`6fe9797`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/6fe97974991d54276ffc4be0f39c41c61f07559d))
- **broadcasts:** make unselected radio buttons visible ([`26bb5c7`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/26bb5c7244184bd652cf0199956dc1169e648252))
- **broadcasts:** improve form dialog spacing and padding ([`16713ff`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/16713ff74092e8fc2b6c711a96ad550344ae22f5))

### Refactor

- **broadcasts:** align preview modal footer with runtime behavior ([`77b6d66`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/77b6d664161cfeb8f5bdf145953fadca2b13f401))

## Marzo 2026

### Novedades

- add total sales score card to subscription movement ([`0081430`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/008143042073d1f704467081b9acd324f5ab5227))
- add renewal score cards to subscription movement view ([`d89ee35`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/d89ee35568b91493f63db58bcd9c1a7a4b63e479))
- sort lost stores table by LTV descending by default ([`37827ee`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/37827ee7dd195401753aeaefccd82bf0e1148303))
- show LTV column and total in lost stores table ([`ac6221e`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/ac6221e97f896b00d586978451be562d073a5a94))
- add subscription movement dashboard view ([`61c4ea8`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/61c4ea876611546c5bc5e4474feac657baa08886))
- add "Desde módulos" button to pre-populate pricing features ([`13eb440`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/13eb4409712db91a94093d56610d8175a01c57cc))
- add pricing table view for plan features management ([`4560499`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/456049945f1993f84240a21ceca734519ee17670))
- add product sub-modules to migrated modules list ([`7c48b71`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/7c48b71e9b72277e0d551c762437735c3ed5173f))
- add mod_fidelizacion to migrated modules list ([`eb221be`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/eb221be59db49c2d6268f3dded2fb53488b3a85a))
- add view toggle and renewal stats to legacy subscriptions tab ([`d61b516`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/d61b5166f9cec81e1197824f55b4b3771c876c74))
- add Google Analytics (G-L5FTPSKYTG) ([`4bada13`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/4bada13735294d5bfc8d52841e9ad83925a5dc3c))
- add legacy subscriptions tab for monitoring during migration ([`b67892f`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/b67892fb149b3aaf957a57485c9c899f30af9b63))
- add subscriptions management module ([`f2562ad`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/f2562ad02879e3d5a3edfc1ec7668c73fee1f6ee))

### Correcciones

- label says ganadas instead of nuevas in total sales card ([`fccd495`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/fccd495e3f0557feee76ee3c708527fa30718114))
- stack gained/lost tables vertically instead of side by side ([`5dcead1`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/5dcead1d051af13ae423f70b51353c2121829470))

## Febrero 2026

### Novedades

- add staging link (tiendabox.co) to store list and detail ([`14d0b5c`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/14d0b5ccee8dab9b583669dbe27e622657d616ce))
- show plan prices in plans matrix header ([`f795da2`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/f795da216e6cad53127a4a717178ea396f47d5bf))
- add commissions revenue charts to dashboard overview ([`7c9323b`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/7c9323bcdebbb75d605d47e90e5ad2f8a2cc53e5))
- unify invoices view with subscriptions, commissions, and billing sources ([`a056843`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/a0568439d9ad69254cb7791516678dbfa8ef5852))
- add plan sales view to superadmin billing section ([`f45073a`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/f45073ab8f3e9d6b6cafa6bace2b6b9263fa0286))
- add billing views (commissions + invoices) to superadmin dashboard ([`cfca712`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/cfca712fd9b12647fdee42cf7e9c13239e8d0e82))
- dashboard improvements - active stores chart, GMV comparison, layout ([`8c2dafc`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/8c2dafccfb0c22dacd3bd93735128c2e5b5d1184))
- add max_users field to plans matrix for user quota management ([`f91ffec`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/f91ffec4acb10c22944557fb23779c7ae53234de))
- improve store modules config with plan defaults, overrides and reset ([`daf77ea`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/daf77eaf4ba3b86a24ce995658ff3d7eac60b2b5))
- filter plans matrix to show only migrated modules with toggle ([`fba9a07`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/fba9a075804df89bfc6a118b531b5bebd7b7396a))
- add pricing matrix view for side-by-side plan comparison ([`ea9c54d`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/ea9c54dca6c89e162719df15342d95730f4537cd))
- add plan and module management to super admin dashboard ([`b4be700`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/b4be70061b120a6b567dcfc4d3a0484fcdc7d3e8))
- Add MCP Tokens management page in superadmin dashboard ([`cace4e1`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/cace4e11ce8390b5be79a310a7d7af55e4ac3ce6))
- simplify plan filter to grouped categories ([`8c7982e`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/8c7982e944205286fff4598de981ee19689d7616))
- default stores list filter to status "vigente" ([`e21217d`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/e21217d7ff78875c554ade290f5bf6249f05a923))
- use real plan names for store list filter dropdown ([`63801b9`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/63801b97d23aa8ddf9dcfd8266ae510d998e4b34))
- use plandetalle_titulo from DB for plan column ([`785d0fa`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/785d0fa112293484c55b6be6659a7eb17d466ea2))
- show billing period instead of price category in plan column ([`5fd6f43`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/5fd6f435331e743d45c9e09dcca5df6b31ab49cc))
- show custom domain in store list when available ([`1736e90`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/1736e9099741a53375be0c18eb5768688b546cee))
- add Net New MRR bars to investor MRR evolution chart ([`96d1a1e`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/96d1a1e381e60521e2899b2c9b07a4f74e07a814))
- add period comparison to investor view KPI cards ([`742beb6`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/742beb6ea8622f3fb2de157792068892d54038b3))
- implement Pipeline phases 2 (dashboard) and 3 (lead detail CRM) ([`4cd5858`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/4cd58582cf73cdd530593916d2abb29c07588767))
- add flag management to pipeline leads view ([`c2935b7`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/c2935b718de2f7497b6278e60d2e5bfaa06ef54c))
- add clickable column sorting to pipeline leads table ([`de6b40d`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/de6b40d166d2ddf96c51c22c29862c8248bc056f))
- add store config panel + extend store detail + list improvements ([`04112ff`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/04112ff21a89325caaa98332933bd0bb368a027c))

### Correcciones

- improve store modules error handling and PrimeVue base styles ([`6ce0d67`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/6ce0d67c73256ce9c0fd8a683684ba62f0254f61))
- correct PrimeVue checkbox checked state CSS selector ([`3864afb`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/3864afb443d4886e730a43ccba3e0bb0d79b6043))
- plans matrix - visible unchecked checkboxes, narrower inputs, commission info rows ([`88afe15`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/88afe15c92a28c26ed2594ac54b8d47d8b9c20b3))
- register ECharts components in pipeline charts to fix runtime error ([`7d1b2c5`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/7d1b2c57eebf161fa3781b57b664489d62f1cb92))
- default commissions view to previous month period ([`896f338`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/896f33811ffb560383bbc3a6abc63f59b45c8bcc))
- filter matrix to show only 5 main plans ([`30a1572`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/30a15729c5227da54be02458f7c10a740d33c86c))
- calculate days remaining in real-time and add trial date columns to leads table ([`77e7210`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/77e7210981f9d78b1dca6ce02ce4bee1684b0a99))
- add Netlify _redirects for SPA client-side routing ([`8325194`](https://github.com/mitienda-pe/mitienda-superadmin-dashboard/commit/832519467e00b827dce238c932a604561c5f4ba2))

