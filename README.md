mentor-graphql
==================

Usage
-----

A docker image that serves mentor-admins's node-based GraphQL api


Running Tests
-------------

```
make test
```

Development
-----------

Required Software
=================
- node 18.13+
- npm
- make


Any changes made to this repo should be covered by tests. To run the existing tests:

```
make test
```

All pushed commits must also pass format and lint checks. To check all required tests before a commit:

```
make test-all
```

To fix formatting issues:

```
make format
```

Technical Debt
-------------
  - mongoose 8
  - track ip package fix here https://github.com/indutny/node-ip/issues/150, delete override once fixed
  - mongo-unit is behind, either fork or switch libraries.
