/*
largura maxima = 100 colunas
tab = 4 espaços
0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789

	Linguagens e Ambientes de Programação (B) - Projeto de 2019/20

	Cartography.c

	Este ficheiro constitui apenas um ponto de partida para o
	seu trabalho. Todo este ficheiro pode e deve ser alterado
	à vontade, a começar por este comentário. É preciso inventar
	muitas funções novas.

COMPILAÇÃO

  gcc -std=c11 -o Main Cartography.c Main.c -lm

IDENTIFICAÇÃO DOS AUTORES

  Aluno 1: 55226 Jose Murta
  Aluno 2: 56153 Diogo Rodrigues

COMENTÁRIO

 Identificacao: 55226_56153
 Comentarios: Realizamos todos os comandos com sucesso, no entanto o ultimo comando "T" pode nao
 	 	 	 estar operacional para outros ficheiros "map.txt", visto que detetamos algumas
 	 	 	 falhas.
 	 	 	 Para podermos imprimir informacoes sobre uma parcela, mostrando diferentes
 	 	 	 componentes da identificacao, alteramos a funcao showParcel adicionando um
 	 	 	 argumento inteiro number.

*/

#include "Cartography.h"

/* STRING -------------------------------------- */

static void showStringVector(StringVector sv, int n) {
	int i;
	for( i = 0 ; i < n ; i++ ) {
		printf("%s\n", sv[i]);
	}
}

/* UTIL */

static void error(String message)
{
	fprintf(stderr, "%s.\n", message);
	exit(1);	// Termina imediatamente a execução do programa
}

static void readLine(String line, FILE *f)	// lê uma linha que existe obrigatoriamente
{
	if( fgets(line, MAX_STRING, f) == NULL )
		error("Ficheiro invalido");
	line[strlen(line) - 1] = '\0';	// elimina o '\n'
}

static int readInt(FILE *f)
{
	int i;
	String line;
	readLine(line, f);
	sscanf(line, "%d", &i);
	return i;
}


/* IDENTIFICATION -------------------------------------- */

static Identification readIdentification(FILE *f)
{
	Identification id;
	String line;
	readLine(line, f);
	sscanf(line, "%s %s %s", id.freguesia, id.concelho, id.distrito);
	return id;
}

static void showIdentification(int pos, Identification id, int z)
{
	if( pos >= 0 ) // pas zero interpretado como não mostrar
		printf("%4d ", pos);
	else
		printf("%4s ", "");
	if( z == 3 )
		printf("%-25s %-13s %-22s", id.freguesia, id.concelho, id.distrito);
	else if( z == 2 )
		printf("%-25s %-13s %-22s", "", id.concelho, id.distrito);
	else
		printf("%-25s %-13s %-22s", "", "", id.distrito);
}

static void showValue(int value)
{
	if( value < 0 ) // value negativo interpretado como char
		printf(" [%c]\n", -value);
	else
		printf(" [%3d]\n", value);
}

static bool sameIdentification(Identification id1, Identification id2, int z)
{
	if( z == 3 )
		return strcmp(id1.freguesia, id2.freguesia) == 0
			&& strcmp(id1.concelho, id2.concelho) == 0
			&& strcmp(id1.distrito, id2.distrito) == 0;
	else if( z == 2 )
		return strcmp(id1.concelho, id2.concelho) == 0
			&& strcmp(id1.distrito, id2.distrito) == 0;
	else
		return strcmp(id1.distrito, id2.distrito) == 0;
}


/* COORDINATES -------------------------------------- */

Coordinates coord(double lat, double lon)
{
	Coordinates c = {lat, lon};
	return c;
}

static Coordinates readCoordinates(FILE *f)
{
	double lat, lon;
	String line;
	readLine(line, f);
	sscanf(line, "%lf %lf", &lat, &lon);
	return coord(lat, lon);
}

bool sameCoordinates(Coordinates c1, Coordinates c2)
{
	return c1.lat == c2.lat && c1.lon == c2.lon;
}

static double toRadians(double deg)
{
	return deg * PI / 180.0;
}

// https://en.wikipedia.org/wiki/Haversine_formula
double haversine(Coordinates c1, Coordinates c2)
{
	double dLat = toRadians(c2.lat - c1.lat);
	double dLon = toRadians(c2.lon - c1.lon);

	double sa = sin(dLat / 2.0);
	double so = sin(dLon / 2.0);

	double a = sa * sa + so * so * cos(toRadians(c1.lat)) * cos(toRadians(c2.lat));
	return EARTH_RADIUS * (2 * asin(sqrt(a)));
}


/* RECTANGLE -------------------------------------- */

Rectangle rect(Coordinates tl, Coordinates br)
{
	Rectangle r = {tl, br};
	return r;
}

static void showRectangle(Rectangle r)
{
	printf("{%lf, %lf, %lf, %lf}",
			r.topLeft.lat, r.topLeft.lon,
			r.bottomRight.lat, r.bottomRight.lon);
}

static Rectangle calculateBoundingBox(Coordinates vs[], int n)
{
	double lat1 = vs[0].lat;
	double lon1 = vs[0].lon;
	double lat2 = vs[0].lat;
	double lon2 = vs[0].lon;
	for(int i = 1; i<n; i++) {
		if(vs[i].lat > lat1)
			lat1 = vs[i].lat;
		if(vs[i].lat < lat2)
			lat2 = vs[i].lat;
		if(vs[i].lon < lon1)
			lon1 = vs[i].lon;
		if(vs[i].lon > lon2)
			lon2 = vs[i].lon;
	}
	return rect(coord(lat1,lon1), coord(lat2,lon2));
}

bool insideRectangle(Coordinates c, Rectangle r)
{
	if(c.lon >= r.topLeft.lon && c.lon <= r.bottomRight.lon &&
			c.lat <= r.topLeft.lat && c.lat >= r.bottomRight.lat)
		return true;
	return false;
}



/* RING -------------------------------------- */

static Ring readRing(FILE *f)
{
	Ring r;
	int i, n = readInt(f);
	if( n > MAX_VERTEXES )
		error("Anel demasiado extenso");
	r.nVertexes = n;
	for( i = 0 ; i < n ; i++ ) {
		r.vertexes[i] = readCoordinates(f);
	}
	r.boundingBox =
		calculateBoundingBox(r.vertexes, r.nVertexes);
	return r;
}


// http://alienryderflex.com/polygon/
bool insideRing(Coordinates c, Ring r)
{
	if( !insideRectangle(c, r.boundingBox) )	// otimização
		return false;
	double x = c.lon, y = c.lat;
	int i, j;
	bool oddNodes = false;
	for( i = 0, j = r.nVertexes - 1 ; i < r.nVertexes ; j = i++ ) {
		double xi = r.vertexes[i].lon, yi = r.vertexes[i].lat;
		double xj = r.vertexes[j].lon, yj = r.vertexes[j].lat;
		if( ((yi < y && y <= yj) || (yj < y && y <= yi))
								&& (xi <= x || xj <= x) ) {
			oddNodes ^= (xi + (y-yi)/(yj-yi) * (xj-xi)) < x;
		}
	}
	return oddNodes;
}

bool adjacentRings(Ring a, Ring b)
{
	for(int i = 0; i<a.nVertexes; i++) {
		for(int j = 0; j<b.nVertexes; j++) {
			if(sameCoordinates(a.vertexes[i], b.vertexes[j]))
				return true;
		}
	}
	return false;
}


/* PARCEL -------------------------------------- */

static Parcel readParcel(FILE *f)
{
	Parcel p;
	p.identification = readIdentification(f);
	int i, n = readInt(f);
	if( n > MAX_HOLES )
		error("Poligono com demasiados buracos");
	p.edge = readRing(f);
	p.nHoles = n;
	for( i = 0 ; i < n ; i++ ) {
		p.holes[i] = readRing(f);
	}
	return p;
}

static void showHeader(Identification id)
{
	showIdentification(-1, id, 3);
	printf("\n");
}

static void showParcel(int pos, Parcel p, int lenght, int number)
{
	showIdentification(pos, p.identification, number);
	showValue(lenght);
}

static bool insideHoles(Coordinates c, Parcel p)
{
	if(p.nHoles == 0)
		return false;
	else {
		for (int i = 0; i<p.nHoles; i++) {
			if(insideRing(c, p.holes[i]))
				return true;
		}
	}
	return false;
}

bool insideParcel(Coordinates c, Parcel p)
{
	if(insideRing(c, p.edge) && !insideHoles(c, p))
		return true;
	return false;
}

bool adjacentParcels(Parcel a, Parcel b)
{
	if(adjacentRings(a.edge, b.edge))
		return true;
	for(int i = 0; i < b.nHoles; i++) {
		if(adjacentRings(a.edge, b.holes[i]))
			return true;
	}
	for(int j = 0; j<a.nHoles; j++) {
		if(adjacentRings(b.edge, a.holes[j]))
			return true;
	}
	return false;
}

/**
 * Funcao que calcula o numero total de vertices dos aneis (interiores e exteriores)
 * da parcela p
 */
static int totalVertexes(Parcel p)
{
	int extVertexes = p.edge.nVertexes;
	int sum = 0;
	for(int i = 0; i<p.nHoles;i++) {
		sum += p.holes[i].nVertexes;
	}
	return (extVertexes + sum);
}

/* CARTOGRAPHY -------------------------------------- */

int loadCartography(String fileName, Cartography *cartography)
{
	FILE *f;
	int i;
	f = fopen(fileName, "r");
	if( f == NULL )
		error("Impossivel abrir ficheiro");
	int n = readInt(f);
	if( n > MAX_PARCELS )
		error("Demasiadas parcelas no ficheiro");
	for( i = 0 ; i < n ; i++ ) {
		(*cartography)[i] = readParcel(f);
	}
	fclose(f);
	return n;
}


static int findLast(Cartography cartography, int n, int j, Identification id)
{
	for(  ; j < n ; j++ ) {
		if( !sameIdentification(cartography[j].identification, id, 3) )
			return j-1;
	}
	return n-1;
}

/**
 * Funcao que retorna o numero da primeira parcela da freguesia com id
 */
static int findFirst(Cartography cartography, int pos, Identification id)
{
	for (int j = pos ; j >= 0; j-- ) {
		if( !sameIdentification(cartography[j].identification, id, 3) )
			return j+1;
	}
	return 0;
}

void showCartography(Cartography cartography, int n)
{
	int last;
	Identification header = {"___FREGUESIA___", "___CONCELHO___", "___DISTRITO___"};
	showHeader(header);
	for( int i = 0 ; i < n ; i = last + 1 ) {
		last = findLast(cartography, n, i, cartography[i].identification);
		showParcel(i, cartography[i], last - i + 1, 3);
	}
}


/* INTERPRETER -------------------------------------- */

static bool checkArgs(int arg)
{
	if( arg != -1 )
		return true;
	else {
		printf("ERRO: FALTAM ARGUMENTOS!\n");
		return false;
	}
}

static bool checkPos(int pos, int n)
{
	if( 0 <= pos && pos < n )
		return true;
	else {
		printf("ERRO: POSICAO INEXISTENTE!\n");
		return false;
	}
}

// L ---------------------------------------------------------------
static void commandListCartography(Cartography cartography, int n)
{
	showCartography(cartography, n);
}

// M pos ---------------------------------------------------------
static void commandMaximum(int pos, Cartography cartography, int n)
{
	if( !checkArgs(pos) || !checkPos(pos, n) )
		return;
	Parcel p = cartography[pos];
	int first = findFirst(cartography, pos, p.identification);
	int last =  findLast(cartography, n, first, p.identification);
	int i = first;
	for(; i<= last; i++) {
		if(totalVertexes(cartography[i]) > totalVertexes(p)) {
			p = cartography[i];
			pos = i;
		}
	}
	showParcel(pos, p, totalVertexes(p), 3);
}

//----------------------------------------------------------------------
/**
 * Funcao auxiliar que modifica o vetor parcels para mostrar nas suas posicoes as
 * parcelas extremas, utiliza o boundingBox para maior eficiencia
 */
static void create(Cartography cartography, int n, int *parcels)
{
	for(int i = 1; i<n; i++) {
		if(cartography[i].edge.boundingBox.topLeft.lat >
				cartography[parcels[0]].edge.boundingBox.topLeft.lat)
			parcels[0] = i;
		if(cartography[i].edge.boundingBox.topLeft.lon <
				cartography[parcels[3]].edge.boundingBox.topLeft.lon)
			parcels[3] = i;
		if(cartography[i].edge.boundingBox.bottomRight.lat <
				cartography[parcels[2]].edge.boundingBox.bottomRight.lat)
			parcels[2] = i;
		if(cartography[i].edge.boundingBox.bottomRight.lon >
				cartography[parcels[1]].edge.boundingBox.bottomRight.lon)
			parcels[1] = i;
	}
}

//X
static void extremes(Cartography cartography, int n)
{
	int parcels[4] = {0, 0, 0, 0};
	create(cartography, n, parcels);
	showParcel(parcels[0], cartography[parcels[0]], -78, 3);
	showParcel(parcels[1], cartography[parcels[1]], -69, 3);
	showParcel(parcels[2], cartography[parcels[2]], -83, 3);
	showParcel(parcels[3], cartography[parcels[3]], -87, 3);
}


//R pos ------------------------------------------------------------------
static void resume(int pos, Cartography cartography, int n)
{
	if( !checkArgs(pos) || !checkPos(pos, n) )
		return;
	Parcel p = cartography[pos];
	showIdentification(pos, p.identification, 3);
	printf("\n");
	printf("%4s ", "");
	if(p.nHoles == 0) {
		printf("%d ", p.edge.nVertexes);
	}
	else if(p.nHoles == 1) {
		printf("%d %d ", p.edge.nVertexes, p.holes[0].nVertexes);
	}
	else if(p.nHoles == 2) {
		printf("%d %d %d ", p.edge.nVertexes, p.holes[0].nVertexes, p.holes[1].nVertexes);
	}
	showRectangle(p.edge.boundingBox);
	printf("\n");
}

//V lat lon pos ------------------------------------------------------------
static void trip(double lat, double lon, int pos, Cartography cartography, int n)
{
	if( !checkArgs(pos) || !checkPos(pos, n) )
		return;
	Coordinates c = coord(lat, lon);
	Parcel p = cartography[pos];
	double min = haversine(c, p.edge.vertexes[0]);
	for(int i = 1; i< p.edge.nVertexes; i++) {
		if(sameCoordinates(c, p.edge.vertexes[i])) {
			min = 0.0;
			break;
		}
		if(haversine(c, p.edge.vertexes[i]) < min)
			min = haversine(c, p.edge.vertexes[i]);
	}
	printf(" %f\n", min);
}

//------------------------------------------------------------------------------
/**
 * Calcula o numero de parcelas com determinada identificacao (limitada pelo number)
 */
static int howManyAux(int pos, Cartography cartography, int n, int number)
{
	Parcel p = cartography[pos];
	int total = 0;
	if(number == 2 || number == 1) {
		for(int i = 0; i<n; i++) {
			if(sameIdentification(cartography[i].identification, p.identification, number))
				total++;
		}
		return total;
	}
	int first = findFirst(cartography, pos, p.identification);
	int last = findLast(cartography,n, pos, p.identification);
	for(int i = first; i <= last; i++) {
		if (sameIdentification(cartography[i].identification, p.identification, number))
			total++;
		}
	return total;
}

// Q pos
static void howMany(int pos, Cartography cartography, int n)
{
	if( !checkArgs(pos) || !checkPos(pos, n) )
		return;
	Parcel p = cartography[pos];
	int numberParcelsFreg = howManyAux(pos, cartography, n, 3);
	int numberParcelsConc = howManyAux(pos, cartography, n, 2);
	int numberParcelsDist = howManyAux(pos, cartography, n, 1);
	showParcel(pos, p, numberParcelsFreg, 3);
	showParcel(pos, p, numberParcelsConc, 2);
	showParcel(pos, p, numberParcelsDist, 1);
}

//--------------------------------------------------------------------------------
/**
 * Funcao de comparacao de String para o qsort (ordem alfabetica)
 */
static int compareString(const void *a, const void *b)
{
	const String *first = a, *second = b;
	if(strcmp(*first, *second) == 0)
		return 0;
	if(strcmp(*first, *second) > 0)
		return 1;
	if(strcmp(*first, *second) < 0)
		return -1;
	return 0;
}

/**
 * Funcao que conta o numero de distritos/concelhos distintos no vetor de
 * String s (vetor ordenado previamente)
 */
static int numCountyOrDistrict(StringVector s, int n)
{
	int counter = 0;
	String p1, p2;
	for(int i = 0; i<= n - 1 ; i++) {
		strcpy(p1, s[i]);
		strcpy(p2,s[i+1]);
		if(strcmp(p1,p2) != 0)
			counter++;
	}
	return counter;
}

//C
static void county(Cartography cartography, int n)
{
	StringVector copy;
	for(int i = 0; i<n; i++) {
		strcpy(copy[i] , cartography[i].identification.concelho);
	}
	qsort(copy, n, sizeof(String), compareString);
	int counterCounty = numCountyOrDistrict(copy, n);
	StringVector s;
	int counter = 0;
	String last;
	strcpy(s[counter] , copy[0]);
	strcpy(last , copy[0]);
	counter++;
	for(int i = 1; i < n; i++) {
		if(strcmp(copy[i], last) != 0) {
			strcpy(s[counter] , copy[i]);
			counter++;
			strcpy(last , copy[i]);
		}
	}
	showStringVector(s, counterCounty);
}

//D
static void district(Cartography cartography, int n)
{
	StringVector copy;
	for(int i = 0; i<n; i++) {
		strcpy(copy[i] , cartography[i].identification.distrito);
	}
	qsort(copy, n, sizeof(String), compareString);
	int counterDistrict = numCountyOrDistrict(copy, n);
	StringVector s;
	int counter = 0;
	String last;
	strcpy(s[counter] , copy[0]);
	strcpy(last , copy[0]);
	counter++;
	for(int i = 1; i < n; i++) {
		if(strcmp(copy[i], last) != 0) {
			strcpy(s[counter] , copy[i]);
			counter++;
			strcpy(last , copy[i]);
		}
	}
	showStringVector(s, counterDistrict);
}

//P lat lon -------------------------------------------------------------------------
static void parcel(double lat, double lon, Cartography cartography, int n)
{
	Coordinates c = coord(lat, lon);
	int i = 0;
	for(; i<n; i++) {
		if(insideParcel(c, cartography[i])) {
			showIdentification(i, cartography[i].identification, 3);
			printf("\n");
			break;
		}
	}
	if(i==n)
		printf("FORA DO MAPA\n");
}

//A pos ----------------------------------------------------------------------
static void adjacent(int pos, Cartography cartography, int n)
{
	if( !checkArgs(pos) || !checkPos(pos, n) )
		return;
	Parcel p = cartography[pos];
	int counter = 0;
	for(int i = 0; i<n; i++) {
		if(adjacentParcels(p, cartography[i]) && i != pos) {
			showIdentification(i, cartography[i].identification, 3);
			printf("\n");
			counter++;
		}
	}
	if(counter == 0)
		printf("NAO HA ADJACENCIAS\n");
}

//-------------------------------------------------------------------
/**
 * Verifica se o vetor vec contem o elemento pos
 */
static bool belongs(int pos, int vec[], int vecSize)
{
	for(int i = 0; i<vecSize; i++) {
		if(pos == vec[i])
			return true;
	}
	return false;
}

/**
 * Calcula o numero de novas adjacencias que vao aparecer em relacao as parcelas
 * identificadas no vetor vect
 */
static int newAdjacent (int vect[], int size, Cartography cartography, int n) {
	int copy[n];
	int counter = size;
	for (int i = 0; i < size ; i++) {
		copy[i] = vect[i];
	}
	int new = 0;
	for (int i = 0; i < size; i++) {
		for (int j = 0; j< n; j++) {
			if(adjacentParcels(cartography[vect[i]],cartography[j]) && !belongs(j,copy,counter)) {
				copy[counter] = j;
				counter++;
				new++;
			}
		}
	}
	return new;
}

//F pos1 pos2
static void frontier(int pos1, int pos2, Cartography cartography, int n)
{
	Parcel p1 = cartography[pos1];
	Parcel p2 = cartography[pos2];
	if(pos1 == pos2) {
		printf(" %d\n", 0);

	}
	else if(adjacentParcels(p1, p2)) {
		printf(" %d\n", 1);
	}
	else {
		int adjacents[n]; //vetor que vai guardando adjacencias
		int countFrontiers = 0; //inteiro que conta as fronteiras passadas
		int counter = 0; //conta o numero de elementos do vetor adjacencias
		adjacents[counter] = pos1;
		counter++;
		int newupdate = 0;
		for (int i = 0; i < counter; i++) {
			if (newupdate == 0) {
				newupdate= newAdjacent(adjacents,counter,cartography,n);
				if (newupdate == 0) {
					printf("NAO HA CAMINHO\n");
					break;
				} else {
					countFrontiers++;
					}
				}

			for (int j = 0; j< n; j++) {
				if(adjacentParcels(cartography[adjacents[i]],cartography[j]) &&
					!belongs(j,adjacents,counter)) {
					adjacents[counter] = j;
					counter++;
					newupdate--;
				}
			}
			if (belongs(pos2,adjacents,counter)){
				printf(" %d\n", countFrontiers);
				break;
			}
		}
	}
}

//-------------------------------------------------------------------------------
/**
 * Retorna o numero da parcela que vai servir de "cobaia" para comparacao e
 * assim formar a particao. A cobaia e um numero de uma parcela que nao esta
 * representada no vetor vec
 */
static int getCobaia (int vec[],int size, Cartography cartography, int n) {
	for (int j = 0; j< n; j++) {
		if (!belongs(j,vec,size)) {
			return j;
		}
	}
	return -1;
}

/**
 * Imprime o vetor com as particoes consoante as indicacoes expressas no enunciado
 */
static void showPartitionVector(int vec[], int size)
{
	int counter = 0;
	int x = 0;
	int first = 0;
	int last = 0;
	for(int i = x; i<size; i++) {
		if(vec[i+1] == -1 && counter == 0) {
			printf(" %d\n", vec[i]);
			x = i+2;
		}
		else {
			if(vec[i]+1 == vec[i+1]) {
				counter++;
			}
			if(vec[i+1] == -1) {
				first = vec[x];
				last = vec[i];
				printf(" %d-%d\n", first, last);
				counter = 0;
				x = i+2;
			}
		}
	}
}

//T dist
static void partition (double dist, Cartography cartography, int n) {
	int ladrao = 1;
	int counter = 0;
	int vec[200];
	int cobaia = 0;
	vec[counter] =cobaia;
	counter++;
	for (;;) {
		if (ladrao != 1) {
			vec[counter] = -1;
			counter++;
			cobaia = getCobaia(vec, counter, cartography, n);
			if (cobaia == -1) {
				break;
			}
			vec[counter] = getCobaia(vec, counter, cartography, n);
			counter++;
			}
			for (int j = 0; j< n; j++) {
				if (((haversine(cartography[cobaia].edge.vertexes[0], cartography[j].edge.vertexes[0])) <=
						dist && !belongs(j,vec,counter)) || counter == 4) {
					vec[counter] = j;
					counter++;
				}
				ladrao++;
			}
		}
	showPartitionVector(vec, counter);
}


void interpreter(Cartography cartography, int n)
{
	String commandLine;
	for(;;) {	// ciclo infinito
		printf("> ");
		readLine(commandLine, stdin);
		char command = ' ';
		double arg1 = -1.0, arg2 = -1.0, arg3 = -1.0;
		sscanf(commandLine, "%c %lf %lf %lf", &command, &arg1, &arg2, &arg3);
		// printf("%c %lf %lf %lf\n", command, arg1, arg2, arg3);
		switch( commandLine[0] ) {
			case 'L': case 'l':	// listar
				commandListCartography(cartography, n);
				break;
			case 'M': case 'm':	// maximo
				commandMaximum(arg1, cartography, n);
				break;
			case 'X': case 'x': //extremos
				extremes(cartography, n);
				break;
			case 'R': case 'r':
				resume(arg1, cartography, n);
				break;
			case 'V': case 'v':
				trip(arg1, arg2, arg3, cartography, n);
				break;
			case 'Q': case 'q':
				howMany(arg1, cartography, n);
				break;
			case 'C': case 'c':
				county(cartography, n);
				break;
			case 'D': case 'd':
				district(cartography, n);
				break;
			case 'P': case 'p':
				parcel(arg1, arg2, cartography, n);
				break;
			case 'A': case 'a':
				adjacent(arg1, cartography, n);
				break;
			case 'F': case 'f':
				frontier(arg1, arg2, cartography, n);
				break;
			case 'T': case 't':
				partition (arg1, cartography,n);
				break;
			case 'Z': case 'z':	// terminar
				printf("Fim de execucao! Volte sempre.\n");
				return;
			default:
				printf("Comando desconhecido: \"%s\"\n", commandLine);
		}
	}
}
